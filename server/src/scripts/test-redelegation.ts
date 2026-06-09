import dotenv from "dotenv";
dotenv.config();

import { generateBurnerKey, buildSubDelegation } from "../services/delegation";

const MOCK_MASTER_CONTEXT = { mock: true };

const MOCK_INTENT = {
  target: "ETH",
  amount_usdc: 500,
  router: "0x2626664c2603336E57B271c5C0b26F421741e481" as const,
};

async function main() {
  console.log("test-redelegation: generating burner key...");
  const burner = generateBurnerKey();
  console.log("Burner address:", burner.address);

  console.log("Building sub-delegation...");
  const subDelegation = await buildSubDelegation(
    MOCK_MASTER_CONTEXT,
    MOCK_INTENT,
    burner
  );

  console.log("\nSub-delegation result:");
  console.log("  burnerAddress:", subDelegation.burnerAddress);
  console.log("  delegator:", subDelegation.signedDelegation.delegator);
  console.log("  delegate:", subDelegation.signedDelegation.delegate);
  console.log("  authority:", subDelegation.signedDelegation.authority);
  console.log("  caveats:", subDelegation.signedDelegation.caveats.length);
  console.log("  signature:", subDelegation.signedDelegation.signature.slice(0, 20) + "...");
  console.log("\nSUCCESS");
}

main().catch(console.error);
