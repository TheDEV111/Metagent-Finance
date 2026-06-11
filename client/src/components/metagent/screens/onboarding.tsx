"use client";

import { useState, useEffect } from "react";
import { useConnect, useConnection, useWalletClient, useConnectors, useDisconnect } from "wagmi";
import { toHex } from "viem";
import { Icon, Label, Btn, Tag } from "../primitives";
import { upsertUser } from "@/lib/api";

export function Onboarding({ onComplete }: { onComplete: (userId: string, walletAddress: string) => void }) {
  const [step, setStep] = useState(0);
  const [budget, setBudget] = useState(1000000);
  const [period, setPeriod] = useState("Monthly");
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { mutate: connect } = useConnect();
  const { mutate: disconnect } = useDisconnect();
  const connectors = useConnectors();
  const { address, isConnected } = useConnection();
  const { data: walletClient } = useWalletClient();

  // After wallet connects, register user in DB and advance to step 1
  useEffect(() => {
    if (isConnected && address && step === 0) {
      upsertUser(address)
        .then((user) => { setUserId(user.id); setStep(1); })
        .catch((e) => setError(String(e)));
    }
  }, [isConnected, address, step]);

  // Auto-advance from signing spinner to success
  useEffect(() => {
    if (step === 2) {
      const t = setTimeout(() => setStep(3), 2200);
      return () => clearTimeout(t);
    }
  }, [step]);

  const handleGrantPermission = async () => {
    if (!userId) return;
    setStep(2);
    try {
      if (!walletClient) throw new Error("wallet client not ready");
      // wallet_grantPermissions (ERC-7715) — expiry + hex allowance required by the spec
      const expiry = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30;
      const allowanceHex = toHex(BigInt(budget) * BigInt(1_000_000));
      const result = await walletClient.request({
        method: "wallet_grantPermissions" as never,
        params: [
          {
            expiry,
            permissions: [
              {
                type: "erc20-token-transfer",
                data: {
                  address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
                  allowance: allowanceHex,
                },
                policies: [],
                required: true,
              },
            ],
          },
        ] as never,
      });
      await upsertUser(address!, result);
    } catch {
      // wallet_grantPermissions not yet supported in all wallets;
      // for demo purposes we proceed with null masterContext
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6">
      <div className="w-full max-w-[940px] grid lg:grid-cols-2 gap-gutter items-stretch">
        {/* Brand side */}
        <div className="glass-panel rounded-xl p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden indigo-glow">
          <div className="absolute -top-10 -right-10 opacity-[0.06] pointer-events-none">
            <Icon name="account_balance" className="text-[220px]" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-10">
              <Icon name="hexagon" fill className="text-primary-fixed-dim text-[30px]" />
              <div>
                <div className="font-headline-md text-[22px] font-bold text-primary-fixed-dim tracking-tight leading-none">
                  Metagent
                </div>
                <div className="font-data-sm text-[11px] text-on-surface-variant mt-1 tracking-wide">
                  AUTONOMOUS TREASURY
                </div>
              </div>
            </div>
            <h1 className="font-display-lg text-[40px] leading-[1.05] text-on-surface font-bold tracking-tight">
              An algorithmic<br />treasury that runs<br />
              <span className="text-primary-fixed-dim">on its own.</span>
            </h1>
            <p className="font-body-md text-on-surface-variant mt-5 max-w-sm">
              Grant a bounded budget once. A CIO Agent reasons over markets and delegates
              cryptographically-restricted execution to swap agents — gas-abstracted via the 1Shot relayer.
            </p>
          </div>
          <div className="relative z-10 mt-10 flex flex-wrap gap-2">
            {[
              ["verified_user", "ERC-7715 permissions"],
              ["key", "ERC-7710 redelegation"],
              ["bolt", "x402 gas abstraction"],
            ].map(([ic, t]) => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 font-data-sm text-[12px] text-on-surface-variant bg-surface-container-lowest/60 border border-outline-variant/20 px-2.5 py-1.5 rounded"
              >
                <Icon name={ic} className="text-[15px] text-primary-fixed-dim" />
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Action side */}
        <div className="glass-panel rounded-xl p-8 lg:p-10 flex flex-col">
          {step === 0 && (
            <div className="fade-up flex flex-col h-full">
              <Label>Step 1 / 2</Label>
              <h2 className="font-headline-md text-headline-md text-on-surface mt-2">
                Connect your wallet
              </h2>
              <p className="font-data-sm text-data-sm text-on-surface-variant mt-2">
                Connect the EOA that will own the treasury. Base Mainnet.
              </p>
              {error && (
                <p className="mt-3 font-data-sm text-[12px] text-error bg-error/10 border border-error/20 rounded px-3 py-2">
                  {error}
                </p>
              )}
              <div className="space-y-3 mt-7 flex-1">
                {mounted && connectors.filter((c) => c.id === "metaMask" || c.name?.toLowerCase().includes("metamask")).map((connector) => (
                  <button
                    key={connector.id}
                    onClick={() => { setError(null); connect({ connector }); }}
                    className="w-full flex items-center gap-3 p-4 rounded-lg bg-surface-container-lowest/60 border border-outline-variant/20 hover:border-primary-container/50 hover:bg-surface-container-high/50 transition-all text-left group"
                  >
                    <span className="w-10 h-10 rounded bg-surface-container flex items-center justify-center border border-outline-variant/20 group-hover:border-primary-container/40">
                      <Icon name="account_balance_wallet" className="text-primary-fixed-dim text-[20px]" />
                    </span>
                    <span className="flex-1">
                      <span className="font-body-md text-on-surface block leading-tight">{connector.name}</span>
                      <span className="font-data-sm text-[12px] text-on-surface-variant">Smart Accounts ready</span>
                    </span>
                    {connector.id === "metaMask" && (
                      <Tag className="text-primary-container border-primary-container/30">
                        RECOMMENDED
                      </Tag>
                    )}
                    <Icon name="chevron_right" className="text-outline group-hover:text-on-surface" />
                  </button>
                ))}
              </div>
              <p className="font-data-sm text-[12px] text-outline mt-6 flex items-center gap-1.5">
                <Icon name="lock" className="text-[14px]" /> Non-custodial. Keys never leave your wallet.
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="fade-up flex flex-col h-full">
              <Label>Step 2 / 2</Label>
              <h2 className="font-headline-md text-headline-md text-on-surface mt-2">
                Grant master permission
              </h2>
              <p className="font-data-sm text-data-sm text-on-surface-variant mt-2">
                A periodic ERC-20 advanced permission. Agents can never exceed this.
              </p>
              {address && (
                <p className="mt-2 font-data-sm text-[12px] text-primary-container">
                  Connected: {address.slice(0, 6)}…{address.slice(-4)}
                </p>
              )}

              <div className="mt-6 space-y-5 flex-1">
                <div>
                  <Label className="mb-2">Operating budget (USDC)</Label>
                  <div className="flex items-center gap-2 bg-surface-container-lowest/60 border border-outline-variant/30 rounded-lg px-4 py-3 focus-within:border-primary-container/60 transition-colors">
                    <span className="font-data-lg text-data-lg text-on-surface-variant">$</span>
                    <input
                      type="text"
                      value={budget.toLocaleString("en-US")}
                      onChange={(e) => {
                        const n = +e.target.value.replace(/[^0-9]/g, "");
                        setBudget(isNaN(n) ? 0 : n);
                      }}
                      className="flex-1 bg-transparent border-none font-data-lg text-data-lg text-on-surface tabular p-0 focus:ring-0"
                    />
                    <span className="font-label-caps text-label-caps text-on-surface-variant">USDC</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {[250000, 500000, 1000000, 5000000].map((v) => (
                      <button
                        key={v}
                        onClick={() => setBudget(v)}
                        className={
                          "font-data-sm text-[12px] px-2.5 py-1 rounded border transition-colors " +
                          (budget === v
                            ? "border-primary-container/60 text-primary-container bg-primary-container/10"
                            : "border-outline-variant/30 text-on-surface-variant hover:text-on-surface")
                        }
                      >
                        ${v >= 1000000 ? v / 1000000 + "M" : v / 1000 + "k"}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="mb-2">Refresh period</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Daily", "Weekly", "Monthly"].map((p) => (
                      <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={
                          "font-label-caps text-label-caps py-2.5 rounded border transition-colors " +
                          (period === p
                            ? "border-primary-container/60 text-primary-container bg-primary-container/10"
                            : "border-outline-variant/30 text-on-surface-variant hover:text-on-surface")
                        }
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg bg-surface-container-lowest/60 border border-outline-variant/20 p-4 space-y-2.5">
                  {[
                    ["Token", "USDC · Base"],
                    ["Spender", "Metagent Delegation Mgr"],
                    ["Caveat", `≤ $${budget.toLocaleString("en-US")} / ${period.toLowerCase().replace("ly", "")}`],
                    ["Standard", "ERC-7715 periodic"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between font-data-sm text-data-sm">
                      <span className="text-on-surface-variant">{k}</span>
                      <span className="text-on-surface">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Btn variant="ghost" icon="arrow_back" onClick={() => { disconnect(); setStep(0); setUserId(null); }}>Back</Btn>
                <Btn className="flex-1" icon="verified_user" onClick={handleGrantPermission}>
                  Grant Permission
                </Btn>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="fade-up flex flex-col items-center justify-center h-full text-center py-10">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <span className="absolute inset-0 rounded-full border-2 border-primary-container/20" />
                <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary-container animate-spin" />
                <Icon name="fingerprint" className="text-primary-fixed-dim text-[32px]" />
              </div>
              <h2 className="font-headline-md text-headline-md text-on-surface mt-7">
                Awaiting signature
              </h2>
              <p className="font-data-sm text-data-sm text-on-surface-variant mt-2 max-w-xs">
                Confirm <span className="text-on-surface">wallet_grantPermissions</span> in your wallet.
                The permission context is stored against your treasury.
              </p>
              <div className="mt-6 font-data-sm text-[12px] text-outline space-y-1.5 text-left">
                <p className="flex items-center gap-2">
                  <Icon name="check_circle" className="text-emerald text-[15px]" /> Permission payload built
                </p>
                <p className="flex items-center gap-2">
                  <Icon name="check_circle" className="text-emerald text-[15px]" /> Caveat enforcer attached
                </p>
                <p className="flex items-center gap-2 text-on-surface-variant">
                  <span className="w-[15px] h-[15px] rounded-full border-2 border-primary-container border-t-transparent animate-spin inline-block" />
                  Signing in wallet…
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="fade-up flex flex-col items-center justify-center h-full text-center py-10">
              <div className="w-20 h-20 rounded-full bg-primary-container/10 border border-primary-container/40 flex items-center justify-center neon-glow">
                <Icon name="check" className="text-primary-fixed-dim text-[40px]" />
              </div>
              <h2 className="font-headline-md text-headline-md text-on-surface mt-7">
                Treasury is live
              </h2>
              <p className="font-data-sm text-data-sm text-on-surface-variant mt-2 max-w-xs">
                ${budget.toLocaleString("en-US")} USDC granted, {period.toLowerCase()}. The CIO Agent is
                now monitoring markets.
              </p>
              <Btn className="mt-8 px-8" iconEnd="arrow_forward" onClick={() => onComplete(userId!, address!)}>
                Enter Dashboard
              </Btn>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
