import OpenAI from "openai";
import type { TradeIntent } from "../../contracts";
import { createAIClient } from "./cio";
import type { Hex } from "viem";

const SWAP_SYSTEM_PROMPT = (intent: TradeIntent) =>
  `You are a Swap Agent. Given this trade intent, return the raw calldata needed to execute it.
Intent: ${JSON.stringify(intent)}
Return strict JSON: { "calldata": "0x...", "to": "0x...", "value": "0" }
No explanation. Raw JSON only.`;

export interface SwapCalldata {
  calldata: Hex;
  to: Hex;
  value: string;
}

export async function getSwapCalldata(
  intent: TradeIntent,
  client: OpenAI = createAIClient()
): Promise<SwapCalldata> {
  const response = await client.chat.completions.create({
    model: "llama-3.3-70b",
    messages: [{ role: "user", content: SWAP_SYSTEM_PROMPT(intent) }],
  });

  const raw = response.choices[0].message.content;
  if (!raw) throw new Error("Swap Agent returned empty response");

  const jsonStr = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const parsed = JSON.parse(jsonStr) as SwapCalldata;

  if (!parsed.calldata || !parsed.to) {
    throw new Error(`Swap Agent returned malformed calldata: ${raw}`);
  }

  return parsed;
}
