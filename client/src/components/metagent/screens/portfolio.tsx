"use client";

import { useBalance, useReadContract, useConnection } from "wagmi";
import { base } from "wagmi/chains";
import { type Address, formatUnits } from "viem";
import { Panel, PanelHead, Label, Tag, Btn, TokenGlyph, Icon } from "../primitives";
import { Donut } from "../charts";
import { fmtUSD } from "@/lib/data";

const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as Address;

export function Portfolio({ nav, walletAddress }: { nav: (r: string) => void; walletAddress: string | null }) {
  const { address } = useConnection();
  const addr = address as Address | undefined;

  const { data: ethBal } = useBalance({ address: addr, chainId: base.id });
  const { data: usdcRaw } = useReadContract({
    address: USDC_ADDRESS,
    abi: [{ name: "balanceOf", type: "function", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" }],
    functionName: "balanceOf",
    args: [addr ?? "0x0000000000000000000000000000000000000000"],
    chainId: base.id,
    query: { enabled: !!addr },
  });

  const usdcValue = usdcRaw !== undefined ? parseFloat(formatUnits(usdcRaw as bigint, 6)) : null;
  const ethValue = ethBal ? parseFloat(formatUnits(ethBal.value, ethBal.decimals)) : null;

  const segments = [
    ...(usdcValue && usdcValue > 0 ? [{ sym: "USDC", pct: 100, value: usdcValue, color: "#00f0ff" }] : []),
    ...(ethValue && ethValue > 0 ? [{ sym: "ETH", pct: 0, value: ethValue * 3500, color: "#b794ff" }] : []),
  ];
  const totalUsd = segments.reduce((s, a) => s + a.value, 0);
  if (segments.length > 1) {
    segments[0].pct = Math.round((segments[0].value / totalUsd) * 100);
    segments[1].pct = 100 - segments[0].pct;
  } else if (segments.length === 1) {
    segments[0].pct = 100;
  }

  const hasBalances = usdcValue !== null || ethValue !== null;

  return (
    <div className="space-y-gutter">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-gutter">
        {[
          {
            l: "USDC Balance",
            v: usdcValue !== null ? fmtUSD(usdcValue, 2) : "—",
            sub: "Base Mainnet",
            icon: "attach_money",
            accent: "text-primary",
          },
          {
            l: "ETH Balance",
            v: ethValue !== null ? ethValue.toFixed(4) + " ETH" : "—",
            sub: "Base Mainnet",
            icon: "currency_exchange",
            accent: "text-primary-fixed-dim",
          },
          {
            l: "Active Positions",
            v: "0",
            sub: "Run CIO Agent to start",
            icon: "savings",
            accent: "text-on-surface",
          },
          {
            l: "Blended APY",
            v: "—",
            sub: "No strategies yet",
            icon: "percent",
            accent: "text-on-surface-variant",
          },
        ].map((k) => (
          <Panel key={k.l} className="p-5">
            <div className="flex items-center justify-between">
              <Label>{k.l}</Label>
              <Icon name={k.icon} className="text-on-surface-variant text-[18px]" />
            </div>
            <div className={"font-data-lg text-[26px] mt-3 tabular " + k.accent}>{k.v}</div>
            <div className="font-data-sm text-[12px] text-on-surface-variant mt-1">{k.sub}</div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Allocation */}
        <Panel className="lg:col-span-5 p-6">
          <PanelHead title="Asset Allocation" sub="Base Mainnet · live balances" right={<Tag>1 NETWORK</Tag>} />
          {!hasBalances ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Icon name="donut_large" className="text-[40px] text-on-surface-variant/30 mb-3" />
              <p className="font-data-sm text-data-sm text-on-surface-variant">Loading wallet balances…</p>
            </div>
          ) : segments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Icon name="account_balance_wallet" className="text-[40px] text-on-surface-variant/30 mb-3" />
              <p className="font-data-sm text-data-sm text-on-surface-variant">No token balances found on Base.</p>
              <p className="font-data-sm text-[12px] text-outline mt-1">Add USDC or ETH on Base Mainnet to see allocation.</p>
            </div>
          ) : (
            <div className="flex items-center gap-7">
              <div className="relative shrink-0">
                <Donut segments={segments} />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-label-caps text-label-caps text-on-surface-variant">TOTAL</span>
                  <span className="font-data-lg text-[16px] text-on-surface tabular">{fmtUSD(totalUsd)}</span>
                </div>
              </div>
              <div className="flex-1 space-y-2.5">
                {segments.map((a) => (
                  <div key={a.sym} className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: a.color }} />
                    <span className="font-data-sm text-data-sm text-on-surface w-14">{a.sym}</span>
                    <span className="font-data-sm text-data-sm text-on-surface-variant flex-1 tabular">{a.pct}%</span>
                    <span className="font-data-sm text-data-sm text-on-surface-variant tabular">{fmtUSD(a.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>

        {/* Holdings */}
        <Panel className="lg:col-span-7 p-0 overflow-hidden">
          <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center">
            <h3 className="font-headline-md text-headline-md text-on-surface">Holdings</h3>
            <Tag>BASE · USDC SETTLEMENT</Tag>
          </div>
          {usdcValue === null && ethValue === null ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Icon name="hourglass_empty" className="text-[40px] text-on-surface-variant/30 mb-3" />
              <p className="font-data-sm text-data-sm text-on-surface-variant">Loading balances…</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/20 bg-surface-container-lowest/50 font-label-caps text-label-caps text-on-surface-variant">
                    <th className="p-4 font-normal">Asset</th>
                    <th className="p-4 font-normal text-right">Balance</th>
                    <th className="p-4 font-normal text-right">USD Value</th>
                    <th className="p-4 font-normal text-right">Chain</th>
                  </tr>
                </thead>
                <tbody>
                  {usdcValue !== null && (
                    <tr className="border-b border-outline-variant/10 hover:bg-surface-container-high/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <TokenGlyph sym="USDC" />
                          <div>
                            <div className="font-data-sm text-data-sm text-on-surface">USDC</div>
                            <div className="font-data-sm text-[12px] text-on-surface-variant">USD Coin</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right font-data-sm text-data-sm text-on-surface tabular">
                        {usdcValue!.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-right font-data-sm text-data-sm text-on-surface tabular">
                        {fmtUSD(usdcValue!, 2)}
                      </td>
                      <td className="p-4 text-right font-data-sm text-[12px] text-on-surface-variant">Base</td>
                    </tr>
                  )}
                  {ethBal && (
                    <tr className="border-b border-outline-variant/10 hover:bg-surface-container-high/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <TokenGlyph sym="WETH" />
                          <div>
                            <div className="font-data-sm text-data-sm text-on-surface">ETH</div>
                            <div className="font-data-sm text-[12px] text-on-surface-variant">Ether</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right font-data-sm text-data-sm text-on-surface tabular">
                        {ethValue!.toFixed(6)}
                      </td>
                      <td className="p-4 text-right font-data-sm text-data-sm text-on-surface tabular">
                        {fmtUSD(ethValue! * 3500, 2)}
                      </td>
                      <td className="p-4 text-right font-data-sm text-[12px] text-on-surface-variant">Base</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      {/* Positions empty state */}
      <Panel className="p-0 overflow-hidden">
        <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center">
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface">Active Positions</h3>
            <p className="font-data-sm text-data-sm text-on-surface-variant mt-1">
              Strategies executed by sub-delegated agents
            </p>
          </div>
          <Btn variant="ghost" icon="smart_toy" onClick={() => nav("agents")}>View Agents</Btn>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Icon name="savings" className="text-[40px] text-on-surface-variant/30 mb-3" />
          <p className="font-data-sm text-data-sm text-on-surface-variant">No active positions yet.</p>
          <p className="font-data-sm text-[12px] text-outline mt-1">Run the CIO Agent from the Dashboard to open your first position.</p>
          <button
            onClick={() => nav("dashboard")}
            className="mt-4 font-data-sm text-data-sm text-primary-container hover:underline flex items-center gap-1.5"
          >
            <Icon name="play_arrow" className="text-[15px]" /> Go to Dashboard
          </button>
        </div>
      </Panel>
    </div>
  );
}
