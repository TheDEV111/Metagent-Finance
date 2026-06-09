"use client";

import { Panel, PanelHead, Label, Tag, Btn, TokenGlyph, Icon } from "../primitives";
import { Donut, Bar } from "../charts";
import * as D from "@/lib/data";

export function Portfolio({ nav }: { nav: (r: string) => void }) {
  return (
    <div className="space-y-gutter">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-gutter">
        {[
          { l: "Net Asset Value", v: "$12,450,892", sub: "+2.4% / 24h", icon: "account_balance", accent: "text-primary" },
          { l: "Deployed in Strategies", v: "$5,179,192", sub: "41.6% of NAV", icon: "savings", accent: "text-on-surface" },
          { l: "Idle Stablecoins", v: "$2,129,767", sub: "Awaiting CIO intent", icon: "pause_circle", accent: "text-on-surface" },
          { l: "Blended APY", v: "8.7%", sub: "Across 4 positions", icon: "percent", accent: "text-emerald" },
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
          <PanelHead
            title="Asset Allocation"
            sub="Across Base Mainnet"
            right={<Tag>1 NETWORK</Tag>}
          />
          <div className="flex items-center gap-7">
            <div className="relative shrink-0">
              <Donut segments={D.allocation} />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-label-caps text-label-caps text-on-surface-variant">TOTAL</span>
                <span className="font-data-lg text-[18px] text-on-surface tabular">$12.45M</span>
              </div>
            </div>
            <div className="flex-1 space-y-2.5">
              {D.allocation.map((a) => (
                <div key={a.sym} className="flex items-center gap-2.5">
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ background: a.color }}
                  />
                  <span className="font-data-sm text-data-sm text-on-surface w-14">{a.sym}</span>
                  <span className="font-data-sm text-data-sm text-on-surface-variant flex-1 tabular">
                    {a.pct}%
                  </span>
                  <span className="font-data-sm text-data-sm text-on-surface-variant tabular">
                    {D.fmtUSD(a.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        {/* Holdings */}
        <Panel className="lg:col-span-7 p-0 overflow-hidden">
          <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center">
            <h3 className="font-headline-md text-headline-md text-on-surface">Holdings</h3>
            <Tag>BASE · USDC SETTLEMENT</Tag>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/20 bg-surface-container-lowest/50 font-label-caps text-label-caps text-on-surface-variant">
                  <th className="p-4 font-normal">Asset</th>
                  <th className="p-4 font-normal text-right">Allocation</th>
                  <th className="p-4 font-normal text-right">APY</th>
                  <th className="p-4 font-normal text-right">Value</th>
                </tr>
              </thead>
              <tbody>
                {D.allocation.map((a) => (
                  <tr
                    key={a.sym}
                    className="border-b border-outline-variant/10 hover:bg-surface-container-high/30 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <TokenGlyph sym={a.sym} />
                        <div>
                          <div className="font-data-sm text-data-sm text-on-surface">{a.sym}</div>
                          <div className="font-data-sm text-[12px] text-on-surface-variant">{a.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 justify-end">
                        <div className="w-20">
                          <Bar pct={a.pct * 2.4} color="" h="h-1" track="bg-surface-container-high" />
                        </div>
                        <span className="font-data-sm text-data-sm text-on-surface-variant w-12 text-right tabular">
                          {a.pct}%
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right font-data-sm text-data-sm tabular">
                      {a.apy > 0 ? (
                        <span className="text-emerald">{a.apy}%</span>
                      ) : (
                        <span className="text-outline">—</span>
                      )}
                    </td>
                    <td className="p-4 text-right font-data-sm text-data-sm text-on-surface tabular">
                      {D.fmtUSD(a.value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      {/* Positions */}
      <Panel className="p-0 overflow-hidden">
        <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center">
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface">Active Positions</h3>
            <p className="font-data-sm text-data-sm text-on-surface-variant mt-1">
              Strategies executed by sub-delegated agents
            </p>
          </div>
          <Btn variant="ghost" icon="smart_toy" onClick={() => nav("agents")}>
            View Agents
          </Btn>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/20 bg-surface-container-lowest/50 font-label-caps text-label-caps text-on-surface-variant">
                <th className="p-4 font-normal">Protocol</th>
                <th className="p-4 font-normal">Position</th>
                <th className="p-4 font-normal">Managed by</th>
                <th className="p-4 font-normal text-right">APY</th>
                <th className="p-4 font-normal text-right">Value</th>
                <th className="p-4 font-normal text-right">State</th>
              </tr>
            </thead>
            <tbody>
              {D.positions.map((p, i) => (
                <tr
                  key={i}
                  className="border-b border-outline-variant/10 hover:bg-surface-container-high/30 transition-colors"
                >
                  <td className="p-4 font-data-sm text-data-sm text-on-surface">{p.protocol}</td>
                  <td className="p-4 font-data-sm text-data-sm text-on-surface-variant">{p.action}</td>
                  <td className="p-4 font-data-sm text-data-sm text-on-surface-variant">{p.agent}</td>
                  <td className="p-4 text-right font-data-sm text-data-sm tabular">
                    {p.apy > 0 ? (
                      <span className="text-emerald">{p.apy}%</span>
                    ) : (
                      <span className="text-outline">—</span>
                    )}
                  </td>
                  <td className="p-4 text-right font-data-sm text-data-sm text-on-surface tabular">
                    {D.fmtUSD(p.amount)}
                  </td>
                  <td className="p-4 text-right">
                    {"health" in p && p.health ? (
                      <span className="font-data-sm text-[12px] text-emerald">Health {p.health}</span>
                    ) : "range" in p && p.range === "in range" ? (
                      <span className="font-data-sm text-[12px] text-primary-container inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 circle bg-primary-container" />
                        In range
                      </span>
                    ) : (
                      <span className="font-data-sm text-[12px] text-outline">
                        {"range" in p ? p.range : "—"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
