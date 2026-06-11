import OpenAI from "openai";
import type { TradeIntent } from "../../contracts";

const UNISWAP_V3_ROUTER = "0x2626664c2603336E57B271c5C0b26F421741e481";

// CIO uses the larger reasoning model — strategic decision making
const CIO_MODEL = "llama-3.3-70b";

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
    if (!ethPrice || !btcPrice) return null;
    return {
      ethPrice,
      eth24hChange: data.ethereum?.usd_24h_change ?? 0,
      btcPrice,
      btc24hChange: data.bitcoin?.usd_24h_change ?? 0,
    };
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
      `[CIO] Market snapshot — ETH: $${market.ethPrice.toFixed(2)} (${market.eth24hChange >= 0 ? "+" : ""}${market.eth24hChange.toFixed(2)}%) · BTC: $${market.btcPrice.toFixed(2)} (${market.btc24hChange >= 0 ? "+" : ""}${market.btc24hChange.toFixed(2)}%)`
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
  const parsed = JSON.parse(jsonStr) as TradeIntent;

  if (!parsed.target || !parsed.amount_usdc || !parsed.router) {
    throw new Error(`CIO Agent returned malformed intent: ${raw}`);
  }

  return parsed;
}
