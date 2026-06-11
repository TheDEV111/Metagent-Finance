import { Router, type Request, type Response, type NextFunction } from "express";
import { randomBytes, createHmac, timingSafeEqual } from "crypto";
import { Prisma } from "../generated/prisma/client";
import { db } from "../lib/db";
import { getCIOTradeIntent } from "../services/ai/cio";
import { getSwapExecution, buildSwapCalldata } from "../services/ai/swap";
import { generateBurnerKey, buildSubDelegation } from "../services/delegation";
import {
  estimateTransaction,
  sendTransaction,
  serializeJson,
  getFeeData,
} from "../services/relayer";

const router = Router();

// Authenticated request type — user is attached by requireAuth middleware
interface AuthReq extends Request {
  user: { id: string; walletAddress: string };
}

// ── Auth middleware ────────────────────────────────────────────────────────────
// Validates Bearer token, attaches req.user, rejects with 401 otherwise.
// Production should upgrade to SIWE (wallet signature) for proof of ownership.
async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const token = header.slice(7).trim();
  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const user = await db.user.findUnique({
      where: { sessionToken: token },
      select: { id: true, walletAddress: true },
    });
    if (!user) {
      res.status(401).json({ error: "Invalid or expired session" });
      return;
    }
    (req as AuthReq).user = user;
    next();
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
}

const toJsonValue = (v: unknown): Prisma.InputJsonValue | typeof Prisma.DbNull =>
  v !== null && v !== undefined ? (v as Prisma.InputJsonValue) : Prisma.DbNull;

// ── POST /api/users — wallet connect / upsert ──────────────────────────────────
// No auth for initial connect. masterContext update requires a valid Bearer token.
router.post("/users", async (req: Request, res: Response) => {
  try {
    const { walletAddress, masterContext } = req.body as {
      walletAddress?: string;
      masterContext?: unknown;
    };

    if (!walletAddress) {
      res.status(400).json({ error: "walletAddress is required" });
      return;
    }

    const existing = await db.user.findUnique({ where: { walletAddress } });

    if (existing) {
      if (masterContext !== undefined) {
        // masterContext update requires the user to be authenticated
        const header = req.headers.authorization;
        if (!header?.startsWith("Bearer ")) {
          res.status(401).json({ error: "Authentication required to update masterContext" });
          return;
        }
        const token = header.slice(7).trim();
        if (!existing.sessionToken || existing.sessionToken !== token) {
          res.status(403).json({ error: "Forbidden" });
          return;
        }
        const updated = await db.user.update({
          where: { walletAddress },
          data: { masterContext: toJsonValue(masterContext) },
        });
        const { sessionToken: _omit, ...safe } = updated;
        void _omit;
        res.json(safe);
      } else {
        // If the user has no sessionToken yet (pre-migration or cleared), generate one now
        if (!existing.sessionToken) {
          const sessionToken = randomBytes(32).toString("hex");
          const updated = await db.user.update({
            where: { walletAddress },
            data: { sessionToken },
          });
          res.json(updated); // includes sessionToken so client can store it
          return;
        }
        // Return existing user including sessionToken so client can restore a session
        res.json(existing);
      }
    } else {
      // New user — generate session token
      const sessionToken = randomBytes(32).toString("hex");
      const user = await db.user.create({
        data: {
          walletAddress,
          sessionToken,
          ...(masterContext !== undefined && { masterContext: toJsonValue(masterContext) }),
        },
      });
      // Return full record including sessionToken on first create
      res.json(user);
    }
  } catch (err) {
    console.error("[POST /api/users]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── GET /api/users/:userId — fetch profile ─────────────────────────────────────
router.get("/users/:userId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { user } = req as AuthReq;
    if (user.id !== req.params["userId"]) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const profile = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true, walletAddress: true,
        treasuryName: true, email: true, emailVerified: true, notifPrefs: true,
      },
    });
    if (!profile) { res.status(404).json({ error: "User not found" }); return; }
    res.json(profile);
  } catch (err) {
    console.error("[GET /api/users/:userId]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── PATCH /api/users/:userId — update profile ─────────────────────────────────
router.patch("/users/:userId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { user } = req as AuthReq;
    if (user.id !== req.params["userId"]) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const { treasuryName, email, emailVerified, notifPrefs } = req.body as {
      treasuryName?: string;
      email?: string;
      emailVerified?: boolean;
      notifPrefs?: unknown;
    };
    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        ...(treasuryName  !== undefined && { treasuryName }),
        ...(email         !== undefined && { email }),
        ...(emailVerified !== undefined && { emailVerified }),
        ...(notifPrefs    !== undefined && { notifPrefs: notifPrefs as Prisma.InputJsonValue }),
      },
      select: {
        id: true, walletAddress: true,
        treasuryName: true, email: true, emailVerified: true, notifPrefs: true,
      },
    });
    res.json(updated);
  } catch (err) {
    console.error("[PATCH /api/users/:userId]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── POST /api/trade — full A2A orchestration ───────────────────────────────────
router.post("/trade", requireAuth, async (req: Request, res: Response) => {
  try {
    const { user } = req as AuthReq;
    const webhookUrl = process.env.WEBHOOK_BASE_URL
      ? `${process.env.WEBHOOK_BASE_URL}/api/webhook/1shot`
      : (req.body as { webhookUrl?: string }).webhookUrl;

    const fullUser = await db.user.findUnique({ where: { id: user.id } });
    if (!fullUser) { res.status(404).json({ error: "User not found" }); return; }

    // Phase 1 — CIO Agent: validated intent (amount_usdc 10–1000, router allowlisted)
    const intent = await getCIOTradeIntent();

    // Phase 2 — burner key + sub-delegation
    const burner = generateBurnerKey();
    const subDelegation = await buildSubDelegation(fullUser.masterContext, intent, burner);

    // Phase 2b — Swap Agent: slippage reasoning + calldata
    const swapExecution = await getSwapExecution(intent);
    console.log(`[POST /api/trade] SWAP slippage=${swapExecution.slippageBps}bps · ${swapExecution.reasoning}`);
    const calldata = buildSwapCalldata(intent, fullUser.walletAddress as `0x${string}`);

    const txs = [{ to: intent.router, data: calldata, value: "0" }];
    const demoMode = process.env.DEMO_MODE === "true";
    let relayerTaskId: string | null = null;
    let tradeStatus: "SUBMITTED" | "PENDING" = "PENDING";

    if (demoMode) {
      // Demo path — skip all 1Shot calls to avoid spurious failures
      relayerTaskId = `demo_${Date.now()}`;
      tradeStatus = "SUBMITTED";
      console.log(`[POST /api/trade] DEMO MODE · task ${relayerTaskId}`);
    } else {
      // Real path — 1Shot fee quote → estimate → send
      try {
        const feeData = await getFeeData();
        const estimate = await estimateTransaction({
          delegation: subDelegation.signedDelegation,
          transactions: txs,
          feeContext: feeData.context,
        });
        if (estimate.success && estimate.context) {
          const send = await sendTransaction({
            delegation: subDelegation.signedDelegation,
            transactions: txs,
            context: estimate.context,
            ...(webhookUrl && { destinationUrl: webhookUrl }),
          });
          relayerTaskId = send.taskId;
          tradeStatus = "SUBMITTED";
        } else {
          console.log("[POST /api/trade] estimate.success=false — saving as PENDING");
        }
      } catch (relayerErr) {
        console.warn("[POST /api/trade] Relayer unavailable — saving as PENDING:", relayerErr);
      }
    }

    const trade = await db.tradeIntent.create({
      data: {
        userId: user.id,
        cioPromptJson: intent as unknown as Prisma.InputJsonValue,
        burnerAddress: burner.address, // public address only — private key is never stored
        subContext: JSON.parse(serializeJson(subDelegation.signedDelegation)) as Prisma.InputJsonValue,
        relayerTaskId,
        status: tradeStatus,
      },
    });

    if (demoMode && tradeStatus === "SUBMITTED") {
      setTimeout(() => {
        db.tradeIntent.update({ where: { id: trade.id }, data: { status: "CONFIRMED" } })
          .then(() => console.log(`[DEMO] trade ${trade.id} auto-confirmed`))
          .catch((e: unknown) => console.error("[DEMO] auto-confirm failed", e));
      }, 5000);
    }

    res.json({ tradeId: trade.id, taskId: relayerTaskId ?? trade.id, intent });
  } catch (err) {
    console.error("[POST /api/trade]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── POST /api/webhook/1shot — relayer status callbacks ─────────────────────────
// Verified via HMAC-SHA256 if WEBHOOK_SECRET is configured.
router.post("/webhook/1shot", async (req: Request, res: Response) => {
  try {
    const webhookSecret = process.env.WEBHOOK_SECRET;
    if (webhookSecret) {
      const sig = req.headers["x-1shot-signature"] as string | undefined;
      if (!sig) {
        res.status(401).json({ error: "Missing webhook signature" });
        return;
      }
      const expected = createHmac("sha256", webhookSecret)
        .update(JSON.stringify(req.body))
        .digest("hex");
      try {
        const sigBuf = Buffer.from(sig, "hex");
        const expBuf = Buffer.from(expected, "hex");
        if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
          res.status(401).json({ error: "Invalid webhook signature" });
          return;
        }
      } catch {
        res.status(401).json({ error: "Invalid webhook signature" });
        return;
      }
    } else {
      console.warn("[WEBHOOK] WEBHOOK_SECRET not set — signature verification skipped");
    }

    const { taskId, status } = req.body as { taskId?: string; status?: string };
    if (!taskId || !status) {
      res.status(400).json({ error: "taskId and status are required" });
      return;
    }

    const tradeStatus =
      status === "Confirmed" ? "CONFIRMED"
      : status === "Reverted" || status === "Rejected" ? "REVERTED"
      : null;

    if (tradeStatus) {
      await db.tradeIntent.updateMany({
        where: { relayerTaskId: taskId },
        data: { status: tradeStatus },
      });
    }

    res.json({ received: true });
  } catch (err) {
    console.error("[POST /api/webhook/1shot]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── GET /api/trades/:userId — trade history ────────────────────────────────────
router.get("/trades/:userId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { user } = req as AuthReq;
    if (user.id !== req.params["userId"]) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const trades = await db.tradeIntent.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, cioPromptJson: true, relayerTaskId: true,
        status: true, createdAt: true, updatedAt: true,
      },
    });
    res.json(trades);
  } catch (err) {
    console.error("[GET /api/trades]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
