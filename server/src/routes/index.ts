import { Router, type Request, type Response } from "express";
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

// POST /api/users — upsert user on wallet connect
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

    const toJsonValue = (v: unknown): Prisma.InputJsonValue | typeof Prisma.DbNull =>
      v !== null && v !== undefined ? (v as Prisma.InputJsonValue) : Prisma.DbNull;

    const existing = await db.user.findUnique({ where: { walletAddress } });
    const user = existing
      ? masterContext !== undefined
        ? await db.user.update({
            where: { walletAddress },
            data: { masterContext: toJsonValue(masterContext) },
          })
        : existing
      : await db.user.create({
          data: { walletAddress, masterContext: toJsonValue(masterContext) },
        });

    res.json(user);
  } catch (err) {
    console.error("[POST /api/users]", err);
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/users/:userId — fetch user profile
router.get("/users/:userId", async (req: Request, res: Response) => {
  try {
    const user = await db.user.findUnique({ where: { id: String(req.params["userId"]) } });
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    res.json(user);
  } catch (err) {
    console.error("[GET /api/users/:userId]", err);
    res.status(500).json({ error: String(err) });
  }
});

// PATCH /api/users/:userId — update profile fields
router.patch("/users/:userId", async (req: Request, res: Response) => {
  try {
    const { treasuryName, email, emailVerified, notifPrefs } = req.body as {
      treasuryName?: string;
      email?: string;
      emailVerified?: boolean;
      notifPrefs?: unknown;
    };
    const user = await db.user.update({
      where: { id: String(req.params["userId"]) },
      data: {
        ...(treasuryName !== undefined && { treasuryName }),
        ...(email       !== undefined && { email }),
        ...(emailVerified !== undefined && { emailVerified }),
        ...(notifPrefs  !== undefined && { notifPrefs: notifPrefs as Prisma.InputJsonValue }),
      },
    });
    res.json(user);
  } catch (err) {
    console.error("[PATCH /api/users/:userId]", err);
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/trade — trigger full A2A orchestration
router.post("/trade", async (req: Request, res: Response) => {
  try {
    const { userId } = req.body as { userId?: string };
    // Prefer env-configured webhook so production callbacks work without client passing localhost
    const webhookUrl =
      process.env.WEBHOOK_BASE_URL
        ? `${process.env.WEBHOOK_BASE_URL}/api/webhook/1shot`
        : (req.body as { webhookUrl?: string }).webhookUrl;

    if (!userId) {
      res.status(400).json({ error: "userId is required" });
      return;
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Phase 1 — CIO Agent produces trade intent
    const intent = await getCIOTradeIntent();

    // Phase 2 — generate burner key + sub-delegation bounded by intent
    const burner = generateBurnerKey();
    const subDelegation = await buildSubDelegation(
      user.masterContext,
      intent,
      burner
    );

    // Phase 2b — Swap Agent: determines execution params, builds real calldata
    const swapExecution = await getSwapExecution(intent);
    console.log(`[POST /api/trade] SWAP AGENT: slippage=${swapExecution.slippageBps}bps · ${swapExecution.reasoning}`);
    const calldata = buildSwapCalldata(intent, user.walletAddress as `0x${string}`);

    // Phase 3 — get locked fee quote then estimate
    const feeData = await getFeeData();

    const txs = [{ to: intent.router, data: calldata, value: "0" }];

    const estimate = await estimateTransaction({
      delegation: subDelegation.signedDelegation,
      transactions: txs,
      feeContext: feeData.context,
    });

    const demoMode = process.env.DEMO_MODE === "true";

    let relayerTaskId: string | null = null;
    let tradeStatus: "SUBMITTED" | "PENDING" = "PENDING";

    if (estimate.success && estimate.context) {
      // Real on-chain path — requires wallet_grantPermissions + USDC
      const send = await sendTransaction({
        delegation: subDelegation.signedDelegation,
        transactions: txs,
        context: estimate.context,
        ...(webhookUrl && { destinationUrl: webhookUrl }),
      });
      relayerTaskId = send.taskId;
      tradeStatus = "SUBMITTED";
    } else if (demoMode) {
      // Demo path — simulate a submitted task so the UI shows the full flow
      relayerTaskId = `demo_${Date.now()}`;
      tradeStatus = "SUBMITTED";
      console.log(`[POST /api/trade] DEMO MODE — simulating submission · task ${relayerTaskId}`);
    } else {
      console.log("[POST /api/trade] estimate.success=false — saving as PENDING (no real permission context yet)");
    }

    // Persist to DB
    const trade = await db.tradeIntent.create({
      data: {
        userId,
        cioPromptJson: intent as unknown as Prisma.InputJsonValue,
        subDelegateKey: burner.privateKey,
        subContext: JSON.parse(serializeJson(subDelegation.signedDelegation)) as Prisma.InputJsonValue,
        relayerTaskId,
        status: tradeStatus,
      },
    });

    // Demo mode: auto-confirm after 5 s to simulate the 1Shot webhook firing
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
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/webhook/1shot — receive status callbacks from 1Shot relayer
router.post("/webhook/1shot", async (req: Request, res: Response) => {
  try {
    const { taskId, status } = req.body as {
      taskId?: string;
      status?: string;
    };

    if (!taskId || !status) {
      res.status(400).json({ error: "taskId and status are required" });
      return;
    }

    const tradeStatus =
      status === "Confirmed"
        ? "CONFIRMED"
        : status === "Reverted" || status === "Rejected"
          ? "REVERTED"
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
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/trades/:userId — fetch trade history for a user
router.get("/trades/:userId", async (req: Request, res: Response) => {
  try {
    const userId = req.params["userId"] as string;

    const trades = await db.tradeIntent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        cioPromptJson: true,
        relayerTaskId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(trades);
  } catch (err) {
    console.error("[GET /api/trades]", err);
    res.status(500).json({ error: String(err) });
  }
});

export default router;
