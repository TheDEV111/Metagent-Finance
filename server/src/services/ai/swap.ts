import OpenAI from "openai";
import { encodeFunctionData, parseUnits, getAddress } from "viem";
import type { Hex } from "viem";
import type { TradeIntent } from "../../contracts";
import { createAIClient } from "./cio";

const USDC_BASE = getAddress("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913");
const WETH_BASE  = getAddress("0x4200000000000000000000000000000000000006");
// Most liquid USDC/WETH pool on Base — 0.05%
const POOL_FEE = 500;

// Swap Agent uses a smaller, faster model — execution-focused vs CIO's strategic reasoning
const SWAP_MODEL = "mistral-small-3-2-24b-instruct";

// Uniswap V3 SwapRouter02 — exactInputSingle (no deadline field unlike SwapRouter01)
const SWAP_ROUTER_ABI = [
  {
    name: "exactInputSingle",
    type: "function",
    stateMutability: "payable",
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "tokenIn",           type: "address" },
          { name: "tokenOut",          type: "address" },
          { name: "fee",               type: "uint24"  },
          { name: "recipient",         type: "address" },
          { name: "amountIn",          type: "uint256" },
          { name: "amountOutMinimum",  type: "uint256" },
          { name: "sqrtPriceLimitX96", type: "uint160" },
        ],
      },
    ],
    outputs: [{ name: "amountOut", type: "uint256" }],
  },
] as const;

export interface SwapExecution {
  slippageBps: number; // 50 = 0.5%, 100 = 1%
  reasoning: string;
}

const SWAP_SYSTEM_PROMPT = (intent: TradeIntent) =>
  `You are a Swap Execution Agent in an autonomous treasury syndicate.
A CIO Agent has issued this trade intent: ${JSON.stringify(intent)}
Determine the appropriate slippage tolerance in basis points and explain your reasoning.
Return strict JSON only: { "slippageBps": 50, "reasoning": "one sentence" }
No markdown. No code blocks. Raw JSON only.`;

export async function getSwapExecution(
  intent: TradeIntent,
  client: OpenAI = createAIClient()
): Promise<SwapExecution> {
  const response = await client.chat.completions.create({
    model: SWAP_MODEL,
    messages: [{ role: "user", content: SWAP_SYSTEM_PROMPT(intent) }],
  });

  const raw = response.choices[0].message.content;
  if (!raw) throw new Error("Swap Agent returned empty response");

  const jsonStr = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

  let parsed: SwapExecution;
  try {
    parsed = JSON.parse(jsonStr) as SwapExecution;
  } catch {
    throw new Error(`Swap Agent returned non-JSON: ${raw.slice(0, 200)}`);
  }

  if (typeof parsed.slippageBps !== "number" || !parsed.reasoning) {
    throw new Error(`Swap Agent returned malformed execution: ${raw}`);
  }

  return parsed;
}

// Encodes a real Uniswap V3 exactInputSingle calldata for USDC → WETH.
// amountOutMinimum is set to 0 here — production would compute from a price oracle.
export function buildSwapCalldata(
  intent: TradeIntent,
  recipient: Hex,
): Hex {
  const amountIn = parseUnits(intent.amount_usdc.toString(), 6);

  return encodeFunctionData({
    abi: SWAP_ROUTER_ABI,
    functionName: "exactInputSingle",
    args: [
      {
        tokenIn:           USDC_BASE,
        tokenOut:          WETH_BASE,
        fee:               POOL_FEE,
        recipient,
        amountIn,
        amountOutMinimum:  BigInt(0),
        sqrtPriceLimitX96: BigInt(0),
      },
    ],
  });
}
