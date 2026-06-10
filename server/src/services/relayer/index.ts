import { randomBytes } from "crypto";
import type { Hex } from "viem";
import { encodeDelegations } from "@metamask/smart-accounts-kit/utils";
import type {
  OneShotCapabilities,
  OneShotFeeData,
  OneShotEstimateResult,
  OneShotSendResult,
  OneShotStatusResult,
  OneShotTaskStatus,
  SignedDelegation,
} from "../../contracts";

const ONESHOT_URL = "https://relayer.1shotapi.com/relayers";
// USDC on Base Mainnet (1Shot does not support Base Sepolia)
export const USDC_BASE: Hex = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
// Base Mainnet chain ID as hex
export const BASE_CHAIN_ID = "0x2105";

const TERMINAL_STATES: OneShotTaskStatus[] = ["Confirmed", "Rejected", "Reverted"];

export function generateSalt(): Hex {
  return `0x${randomBytes(32).toString("hex")}`;
}

// BigInt-safe JSON serializer
export function serializeJson(obj: unknown): string {
  return JSON.stringify(obj, (_key, value) =>
    typeof value === "bigint" ? `0x${value.toString(16)}` : value
  );
}

// Encode a signed delegation to the hex-encoded permissionContext bytes
// that 1Shot (and ERC-7710) expect on each transaction
export function encodePermissionContext(delegation: SignedDelegation): Hex {
  // Our SignedDelegation is structurally identical to the kit's Delegation at runtime;
  // the types diverge only in how the kit's internal PermissionContext union is expressed.
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return encodeDelegations([delegation]);
}

async function rpcCall<T>(method: string, params: unknown): Promise<T> {
  const apiKey = process.env.ONESHOT_API_KEY;
  if (!apiKey) throw new Error("ONESHOT_API_KEY not set in env");

  const res = await fetch(ONESHOT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: serializeJson({ jsonrpc: "2.0", id: 1, method, params }),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`1Shot HTTP ${res.status}: ${text}`);

  const json = JSON.parse(text);
  if (json.error) throw new Error(`1Shot RPC error [${json.error.code}]: ${json.error.message}`);

  return json.result as T;
}

export async function getCapabilities(
  chainId: string = BASE_CHAIN_ID
): Promise<OneShotCapabilities> {
  const result = await rpcCall<Record<string, OneShotCapabilities>>(
    "relayer_getCapabilities",
    [chainId]
  );
  const numericId = parseInt(chainId, 16).toString();
  return result[numericId] as OneShotCapabilities;
}

export async function getFeeData(
  chainId: string = BASE_CHAIN_ID,
  token: Hex = USDC_BASE
): Promise<OneShotFeeData> {
  return rpcCall<OneShotFeeData>("relayer_getFeeData", { chainId, token });
}

export async function estimateTransaction(params: {
  chainId?: string;
  delegation: SignedDelegation;
  transactions: { to: Hex; data: Hex; value?: string }[];
  feeToken?: Hex;
  feeContext?: string; // locked fee quote from getFeeData
}): Promise<OneShotEstimateResult> {
  const permissionContext = encodePermissionContext(params.delegation);
  const from = params.delegation.delegate;

  return rpcCall<OneShotEstimateResult>("relayer_estimate7710Transaction", {
    chainId: params.chainId ?? BASE_CHAIN_ID,
    feeToken: params.feeToken ?? USDC_BASE,
    ...(params.feeContext && { context: params.feeContext }),
    transactions: params.transactions.map((tx) => ({
      from,
      ...tx,
      permissionContext,
    })),
  });
}

export async function sendTransaction(params: {
  chainId?: string;
  delegation: SignedDelegation;
  transactions: { to: Hex; data: Hex; value?: string }[];
  context: string; // price-locked context from estimateTransaction result
  feeToken?: Hex;
  destinationUrl?: string; // webhook
}): Promise<OneShotSendResult> {
  const permissionContext = encodePermissionContext(params.delegation);
  const from = params.delegation.delegate;

  return rpcCall<OneShotSendResult>("relayer_send7710Transaction", {
    chainId: params.chainId ?? BASE_CHAIN_ID,
    feeToken: params.feeToken ?? USDC_BASE,
    context: params.context,
    transactions: params.transactions.map((tx) => ({
      from,
      ...tx,
      permissionContext,
    })),
    ...(params.destinationUrl && { destinationUrl: params.destinationUrl }),
  });
}

export async function pollStatus(
  taskId: string,
  { maxAttempts = 20, intervalMs = 3000 } = {}
): Promise<OneShotStatusResult> {
  for (let i = 0; i < maxAttempts; i++) {
    const result = await rpcCall<OneShotStatusResult>("relayer_getStatus", [taskId]);
    console.log(`  [${i + 1}/${maxAttempts}] status: ${result.status}`);

    if (TERMINAL_STATES.includes(result.status)) return result;

    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`1Shot task ${taskId} did not reach terminal state after ${maxAttempts} attempts`);
}
