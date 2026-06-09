import {
  CaveatType,
  ScopeType,
  createDelegation,
  getSmartAccountsEnvironment,
  signDelegation,
} from "@metamask/smart-accounts-kit";
import { createCaveatBuilder } from "@metamask/smart-accounts-kit/utils";
import { base } from "viem/chains";
import { parseUnits, getAddress } from "viem";
import { generatePrivateKey, privateKeyToAddress } from "viem/accounts";
import type { Hex } from "viem";
import type { SubDelegation, TradeIntent } from "../../contracts";

// USDC on Base Mainnet (1Shot only supports mainnet)
const USDC_BASE = getAddress("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913");

export function generateBurnerKey(): { privateKey: Hex; address: Hex } {
  const privateKey = generatePrivateKey();
  const address = privateKeyToAddress(privateKey);
  return { privateKey, address };
}

export async function buildSubDelegation(
  _masterContext: unknown,
  intent: TradeIntent,
  burner: { privateKey: Hex; address: Hex }
): Promise<SubDelegation> {
  const systemPrivateKey = process.env.SYSTEM_PRIVATE_KEY as Hex | undefined;
  if (!systemPrivateKey) throw new Error("SYSTEM_PRIVATE_KEY not set in env");

  const env = getSmartAccountsEnvironment(base.id);
  const systemAddress = privateKeyToAddress(systemPrivateKey);

  const caveats = createCaveatBuilder(env)
    .addCaveat(CaveatType.AllowedTargets, {
      targets: [getAddress(intent.router)],
    })
    .build();

  // In production: swap scope for parentPermissionContext from wallet_grantPermissions:
  //   createDelegation({ ..., parentPermissionContext: _masterContext })
  const delegation = createDelegation({
    from: systemAddress,
    to: burner.address,
    caveats,
    environment: env,
    scope: {
      type: ScopeType.Erc20TransferAmount,
      tokenAddress: USDC_BASE,
      maxAmount: parseUnits(String(intent.amount_usdc), 6),
    },
  });

  const signature = await signDelegation({
    privateKey: systemPrivateKey,
    delegation,
    delegationManager: env.DelegationManager,
    chainId: base.id,
  });

  return {
    burnerAddress: burner.address,
    burnerPrivateKey: burner.privateKey,
    signedDelegation: {
      delegate: delegation.delegate,
      delegator: delegation.delegator,
      authority: delegation.authority,
      caveats: delegation.caveats as SubDelegation["signedDelegation"]["caveats"],
      salt: delegation.salt,
      signature,
    },
  };
}
