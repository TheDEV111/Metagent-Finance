import dotenv from "dotenv";
dotenv.config();

import { generateBurnerKey, buildSubDelegation } from "../services/delegation";
import {
  getCapabilities,
  getFeeData,
  estimateTransaction,
  sendTransaction,
  pollStatus,
  USDC_BASE,
  BASE_CHAIN_ID,
} from "../services/relayer";

const MOCK_INTENT = {
  target: "ETH",
  amount_usdc: 500,
  router: "0x2626664c2603336E57B271c5C0b26F421741e481" as const,
};

const MOCK_TRANSACTION = {
  to: MOCK_INTENT.router,
  data: "0x" as const,
  value: "0",
};

async function main() {
  // ── Step 1: Build delegation ──────────────────────────────────────────────
  console.log("Step 1: Generating burner key + sub-delegation...");
  const burner = generateBurnerKey();
  const subDelegation = await buildSubDelegation({}, MOCK_INTENT, burner);
  console.log("  delegator:", subDelegation.signedDelegation.delegator);
  console.log("  delegate :", subDelegation.signedDelegation.delegate);
  console.log("  caveats  :", subDelegation.signedDelegation.caveats.length);

  // ── Step 2: Discover capabilities ────────────────────────────────────────
  console.log("\nStep 2: Fetching 1Shot capabilities...");
  const caps = await getCapabilities(BASE_CHAIN_ID);
  console.log("  feeCollector:", caps?.feeCollector ?? "n/a");
  console.log("  targetAddress:", caps?.targetAddress ?? "n/a");

  // ── Step 3: Get locked fee quote ──────────────────────────────────────────
  console.log("\nStep 3: Fetching fee data...");
  const feeData = await getFeeData(BASE_CHAIN_ID, USDC_BASE);
  console.log("  minFee:", feeData.minFee);
  console.log("  expiry:", new Date(feeData.expiry * 1000).toISOString());

  // ── Step 4: Estimate ──────────────────────────────────────────────────────
  console.log("\nStep 4: Estimating transaction...");
  const estimate = await estimateTransaction({
    chainId: BASE_CHAIN_ID,
    delegation: subDelegation.signedDelegation,
    transactions: [MOCK_TRANSACTION],
  });
  console.log("  success              :", estimate.success);
  console.log("  requiredPaymentAmount:", estimate.requiredPaymentAmount);
  console.log("  gasUsed              :", estimate.gasUsed);

  if (!estimate.success) {
    console.log(
      "\nNOTE: estimate.success=false is expected with a mock ROOT_AUTHORITY delegation.",
      "\nThis validates that the relayer API accepts the request format correctly.",
      "\nThe estimate will succeed once wallet_grantPermissions provides a real permissionContext.",
      "\n(see services/delegation/index.ts line ~43: swap scope for parentPermissionContext)"
    );
    return;
  }

  // ── Step 5: Send (uncomment when real permissionContext is wired up) ──────
  // console.log("\nStep 5: Sending transaction...");
  // const send = await sendTransaction({
  //   chainId: BASE_CHAIN_ID,
  //   delegation: subDelegation.signedDelegation,
  //   transactions: [MOCK_TRANSACTION],
  //   context: estimate.context,
  // });
  // console.log("  taskId:", send.taskId);

  // ── Step 6: Poll status ───────────────────────────────────────────────────
  // console.log("\nStep 6: Polling status...");
  // const result = await pollStatus(send.taskId);
  // console.log("  final status:", result.status);
  // if (result.txHash) console.log("  txHash:", result.txHash);

  console.log("\nSUCCESS");
}

main().catch(console.error);
