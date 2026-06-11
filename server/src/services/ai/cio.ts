import OpenAI from "openai";
import { z } from "zod";
import type { TradeIntent } from "../../contracts";

const UNISWAP_V3_ROUTER = "0x2626664c2603336E57B271c5C0b26F421741e481";

// Allowlisted router addresses — compared case-insensitively so AI casing variation doesn't break validation
const ALLOWED_ROUTERS = new Set([UNISWAP_V3_ROUTER.toLowerCase()]);

const CIO_MODEL = "llama-3.3-70b";

const TradeIntentSchema = z.object({
  target: z.string().min(1).max(10),
  amount_usdc: z
    .number()
    .finite()
    .positive()
    .min(10, "amount_usdc must be at least 10")
    .max(1000, "amount_usdc must be at most 1000"),
  router: z.string().refine(
    (r) => ALLOWED_ROUTERS.has(r.toLowerCase()),
    { message: "Router address not in allowed list" }
  ),
});

export function createAIClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.VENICE_API_KEY,
    baseURL: "https://api.venice.ai/api/v1",
  });
}

interface MarketSnapshot {
  ethPrice: number;
  eth24hChange: number;
  btcPrice: number;
  btc24hChange: number;
}

async function fetchMarketSnapshot(): Promise<MarketSnapshot | null> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin&vs_currencies=usd&include_24hr_change=true",
      { signal: AbortSignal.timeout(4000) }
    );
    if (!res.ok) return null;
    const data = await res.json() as {
      ethereum?: { usd?: number; usd_24h_change?: number };
      bitcoin?: { usd?: number; usd_24h_change?: number };
    };
    const ethPrice = data.ethereum?.usd;
    const btcPrice = data.bitcoin?.usd;
    if (typeof ethPrice !== "number" || typeof btcPrice !== "number") return null;
    const eth24hChange = data.ethereum?.usd_24h_change;
    const btc24hChange = data.bitcoin?.usd_24h_change;
    if (typeof eth24hChange !== "number" || typeof btc24hChange !== "number") return null;
    return { ethPrice, eth24hChange, btcPrice, btc24hChange };
  } catch {
    return null;
  }
}

function buildCIOPrompt(market: MarketSnapshot | null): string {
  const marketSection = market
    ? `Current market data (live):
- ETH/USD: $${market.ethPrice.toFixed(2)} (${market.eth24hChange >= 0 ? "+" : ""}${market.eth24hChange.toFixed(2)}% 24h)
- BTC/USD: $${market.btcPrice.toFixed(2)} (${market.btc24hChange >= 0 ? "+" : ""}${market.btc24hChange.toFixed(2)}% 24h)`
    : "Market data unavailable — use conservative defaults.";

  return `You are a CIO Agent for an autonomous treasury syndicate running on Base Mainnet.
${marketSection}
Analyze market conditions and determine the optimal USDC → ETH trade size.
amount_usdc must be between 10 and 1000. Scale up on bullish momentum, down on bearish.
Output a single trade intent as strict JSON:
{ "target": "ETH", "amount_usdc": <number>, "router": "${UNISWAP_V3_ROUTER}" }
No explanation. No markdown. No code blocks. Raw JSON only.`;
}

export async function getCIOTradeIntent(
  client: OpenAI = createAIClient()
): Promise<TradeIntent> {
  const market = await fetchMarketSnapshot();

  if (market) {
    console.log(
      `[CIO] ETH: $${market.ethPrice.toFixed(2)} (${market.eth24hChange >= 0 ? "+" : ""}${market.eth24hChange.toFixed(2)}%) · BTC: $${market.btcPrice.toFixed(2)} (${market.btc24hChange >= 0 ? "+" : ""}${market.btc24hChange.toFixed(2)}%)`
    );
  } else {
    console.warn("[CIO] Market data unavailable — using conservative defaults");
  }

  const response = await client.chat.completions.create({
    model: CIO_MODEL,
    messages: [{ role: "user", content: buildCIOPrompt(market) }],
  });

  const raw = response.choices[0].message.content;
  if (!raw) throw new Error("CIO Agent returned empty response");

  const jsonStr = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error(`CIO Agent returned non-JSON: ${raw.slice(0, 200)}`);
  }

  // Validate schema, ranges, and router allowlist
  const result = TradeIntentSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`CIO Agent response failed validation: ${result.error.message}`);
  }

  return result.data as TradeIntent;
}
