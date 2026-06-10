import { Router, type Request, type Response } from "express";
import { Prisma } from "../generated/prisma/client";
import { db } from "../lib/db";
import { getCIOTradeIntent } from "../services/ai/cio";
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

    // Phase 3 — get locked fee quote then estimate
    const feeData = await getFeeData();

    const txs = [{ to: intent.router, data: "0x" as const, value: "0" }];

    const estimate = await estimateTransaction({
      delegation: subDelegation.signedDelegation,
      transactions: txs,
      feeContext: feeData.context,
    });

    // Only submit to relayer when the estimate succeeded.
    // estimate.success is false when using ROOT_AUTHORITY (no real wallet_grantPermissions
    // context yet). In that case we still persist the intent as PENDING so the UI can show it.
    let relayerTaskId: string | null = null;
    let tradeStatus: "SUBMITTED" | "PENDING" = "PENDING";

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
