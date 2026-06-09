import type { Hex } from "viem";

export interface TradeIntent {
  target: string;
  amount_usdc: number;
  router: Hex;
}

export interface DelegationCaveat {
  enforcer: Hex;
  terms: Hex;
  args: Hex;
}

export interface SignedDelegation {
  delegate: Hex;
  delegator: Hex;
  authority: Hex;
  caveats: DelegationCaveat[];
  salt: Hex;
  signature: Hex;
}

export interface SubDelegation {
  burnerAddress: Hex;
  burnerPrivateKey: Hex;
  signedDelegation: SignedDelegation;
}

// 1Shot Relayer types
export interface OneShotCapabilities {
  feeCollector: Hex;
  targetAddress: Hex;
  supportedTokens: Hex[];
}

export interface OneShotFeeData {
  gasPrice: string;
  rate: string;
  minFee: string;
  expiry: number;
  context: string; // locked fee context — pass to estimate + send
}

export interface OneShotEstimateResult {
  success: boolean;
  requiredPaymentAmount: string;
  gasUsed: string;
  context: string; // price-locked context — pass to send
}

export interface OneShotSendResult {
  taskId: string;
}

export type OneShotTaskStatus =
  | "Pending"
  | "Processing"
  | "Confirmed"
  | "Rejected"
  | "Reverted";

export interface OneShotStatusResult {
  taskId: string;
  status: OneShotTaskStatus;
  txHash?: Hex;
}
