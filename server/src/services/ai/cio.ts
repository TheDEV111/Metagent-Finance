import OpenAI from "openai";
import type { TradeIntent } from "../../contracts";

const CIO_SYSTEM_PROMPT = `You are a CIO Agent for an autonomous treasury syndicate.
Your only job is to output a single trade intent as strict JSON with this exact shape:
{ "target": "ETH", "amount_usdc": 500, "router": "0x2626664c2603336E57B271c5C0b26F421741e481" }
No explanation. No markdown. No code blocks. Raw JSON only.`;

export function createAIClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.VENICE_API_KEY,
    baseURL: "https://api.venice.ai/api/v1",
  });
}

export async function getCIOTradeIntent(
  client: OpenAI = createAIClient()
): Promise<TradeIntent> {
  const response = await client.chat.completions.create({
    model: "llama-3.3-70b",
    messages: [{ role: "user", content: CIO_SYSTEM_PROMPT }],
  });

  const raw = response.choices[0].message.content;
  if (!raw) throw new Error("CIO Agent returned empty response");

  // Strip markdown code fences if the model wraps the JSON
  const jsonStr = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const parsed = JSON.parse(jsonStr) as TradeIntent;

  if (!parsed.target || !parsed.amount_usdc || !parsed.router) {
    throw new Error(`CIO Agent returned malformed intent: ${raw}`);
  }

  return parsed;
}
