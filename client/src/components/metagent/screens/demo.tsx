"use client";

import { useState } from "react";
import {
  Icon, Panel, PanelHead, Label, Tag, TxStatus, RouteCell, AgentStatus,
} from "../primitives";
import { AreaChart, Donut, Bar } from "../charts";
import * as D from "@/lib/data";

const TABS = [
  ["overview", "Overview", "dashboard"],
  ["portfolio", "Portfolio", "account_balance_wallet"],
  ["agents", "Agents", "smart_toy"],
  ["permissions", "Permissions", "key"],
  ["activity", "Activity", "receipt_long"],
  ["terminal", "CIO Terminal", "neurology"],
] as const;

type Tab = (typeof TABS)[number][0];

const KIND_COLOR: Record<string, string> = {
  INFO: "text-tertiary-fixed-dim",
  REASONING: "text-primary-container",
  ACTION: "text-secondary-fixed-dim",
  INTENT: "text-amber",
  RELAY: "text-violet",
  ERROR: "text-error",
};

export function Demo() {
  const [tab, setTab] = useState<Tab>("overview");
  const t = D.treasury;
  const usedPct = Math.round((t.masterUsed / t.masterBudget) * 100);
  const totalDelegated = D.burnerKeys.filter((k) => k.status === "active").reduce((s, k) => s + k.limit, 0);

  return (
    <div className="space-y-gutter">
      {/* Demo banner */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-amber/30 bg-amber/5">
        <Icon name="science" className="text-amber text-[18px] shrink-0" />
        <div className="flex-1">
          <span className="font-label-caps text-label-caps text-amber">DEMO MODE</span>
          <p className="font-data-sm text-[12px] text-on-surface-variant mt-0.5">
            Simulated treasury — illustrates what a fully-running $12.45M syndicate looks like. No real funds.
          </p>
        </div>
        <Tag className="shrink-0 text-amber border-amber/30">SIMULATED DATA</Tag>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 flex-wrap border-b border-outline-variant/15 pb-0 -mb-gutter">
        {TABS.map(([key, label, ic]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={
              "flex items-center gap-2 px-4 py-3 font-label-caps text-label-caps border-b-2 transition-colors " +
              (tab === key
                ? "border-primary-container text-primary-container"
                : "border-transparent text-on-surface-variant hover:text-on-surface")
            }
          >
            <Icon name={ic} className="text-[16px]" />
            {label}
          </button>
        ))}
      </div>

      <div className="pt-2">
        {/* ── OVERVIEW ─────────────────────────────────────────────── */}
        {tab === "overview" && (
          <div className="space-y-gutter fade-up">
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-gutter">
              {[
                { l: "Total Value Locked", v: D.fmtUSD(t.tvl, 2), sub: "Base Mainnet", icon: "account_balance", c: "text-primary" },
                { l: "24h PnL", v: "+" + D.fmtUSD(t.pnl24h, 2), sub: "+2.4% vs yesterday", icon: "trending_up", c: "text-emerald" },
                { l: "Yield Generation", v: "+" + D.fmtUSD(t.yieldGen), sub: "Aave + Curve", icon: "savings", c: "text-primary-fixed-dim" },
                { l: "Active Trading", v: "+" + D.fmtUSD(t.activeTrading), sub: "CIO + execution agents", icon: "swap_horiz", c: "text-secondary-fixed-dim" },
              ].map((k) => (
                <Panel key={k.l} className="p-5">
                  <div className="flex items-center justify-between">
                    <Label>{k.l}</Label>
                    <Icon name={k.icon} className="text-on-surface-variant text-[18px]" />
                  </div>
                  <div className={"font-data-lg text-[26px] mt-3 tabular " + k.c}>{k.v}</div>
                  <div className="font-data-sm text-[12px] text-on-surface-variant mt-1">{k.sub}</div>
                </Panel>
              ))}
            </div>

            {/* Treasury hero chart */}
            <Panel glow className="p-6 relative overflow-hidden min-h-[300px] flex flex-col">
              <div className="absolute top-0 right-0 p-4 opacity-[0.06] pointer-events-none">
                <Icon name="account_balance" className="text-[150px]" />
              </div>
              <PanelHead
                title="Treasury Equity Curve"
                sub="Simulated AUM growth · Base Mainnet"
                live
                right={<Tag>DEMO</Tag>}
              />
              <div className="relative z-[1] flex-1 -mx-2 mt-4 flex items-end">
                <AreaChart data={t.equity} h={140} />
              </div>
              <div className="relative z-10 mt-4 grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { l: "TVL", v: D.fmtUSD(t.tvl, 2) },
                  { l: "30d Change", v: "+8.9%" },
                  { l: "Sharpe Ratio", v: "2.14" },
                  { l: "Max Drawdown", v: "−1.2%" },
                ].map((s) => (
                  <div key={s.l}>
                    <Label className="mb-1">{s.l}</Label>
                    <div className="font-data-sm text-data-sm text-on-surface tabular">{s.v}</div>
                  </div>
                ))}
              </div>
            </Panel>

            {/* Recent activity */}
            <Panel className="p-0 overflow-hidden">
              <div className="p-5 border-b border-outline-variant/10 flex items-center justify-between">
                <h3 className="font-headline-md text-headline-md text-on-surface">Live Activity</h3>
                <Tag>DEMO</Tag>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant/20 bg-surface-container-lowest/50 font-label-caps text-label-caps text-on-surface-variant">
                      <th className="p-4 font-normal">Asset / Route</th>
                      <th className="p-4 font-normal">Agent</th>
                      <th className="p-4 font-normal text-right">Amount</th>
                      <th className="p-4 font-normal">Status</th>
                    </tr>
                  </thead>
                  <tbody className="font-data-sm text-data-sm">
                    {D.activity.slice(0, 4).map((a) => (
                      <tr key={a.id} className="border-b border-outline-variant/10 hover:bg-surface-container-high/30 transition-colors">
                        <td className="p-4"><RouteCell from={a.from} to={a.to} /></td>
                        <td className="p-4 text-on-surface-variant">{a.agent}</td>
                        <td className="p-4 text-on-surface text-right tabular">{D.fmtUSD(a.amount, 2)}</td>
                        <td className="p-4"><TxStatus status={a.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        )}

        {/* ── PORTFOLIO ────────────────────────────────────────────── */}
        {tab === "portfolio" && (
          <div className="space-y-gutter fade-up">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-gutter">
              {[
                { l: "USDC Balance", v: D.fmtUSD(D.allocation[0].value, 2), sub: "Base Mainnet", icon: "attach_money", c: "text-primary" },
                { l: "WETH Balance", v: "1,017.42 WETH", sub: "Base Mainnet", icon: "currency_exchange", c: "text-primary-fixed-dim" },
                { l: "Active Positions", v: String(D.positions.length), sub: D.positions.length + " strategies running", icon: "savings", c: "text-on-surface" },
                { l: "Blended APY", v: "6.84%", sub: "Weighted avg across positions", icon: "percent", c: "text-emerald" },
              ].map((k) => (
                <Panel key={k.l} className="p-5">
                  <div className="flex items-center justify-between">
                    <Label>{k.l}</Label>
                    <Icon name={k.icon} className="text-on-surface-variant text-[18px]" />
                  </div>
                  <div className={"font-data-lg text-[26px] mt-3 tabular " + k.c}>{k.v}</div>
                  <div className="font-data-sm text-[12px] text-on-surface-variant mt-1">{k.sub}</div>
                </Panel>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
              {/* Allocation donut */}
              <Panel className="lg:col-span-5 p-6">
                <PanelHead title="Asset Allocation" sub="Base Mainnet · 5 assets" right={<Tag>DEMO</Tag>} />
                <div className="flex items-center gap-7 mt-4">
                  <div className="relative shrink-0">
                    <Donut segments={D.allocation} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="font-label-caps text-label-caps text-on-surface-variant">TOTAL</span>
                      <span className="font-data-lg text-[16px] text-on-surface tabular">$12.45M</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2.5">
                    {D.allocation.map((a) => (
                      <div key={a.sym} className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: a.color }} />
                        <span className="font-data-sm text-data-sm text-on-surface w-12">{a.sym}</span>
                        <span className="font-data-sm text-data-sm text-on-surface-variant flex-1 tabular">{a.pct}%</span>
                        <span className="font-data-sm text-[12px] text-on-surface-variant tabular">{D.fmtUSD(a.value)}</span>
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
                        <th className="p-4 font-normal text-right">USD Value</th>
                        <th className="p-4 font-normal text-right">APY</th>
                      </tr>
                    </thead>
                    <tbody>
                      {D.allocation.map((a) => (
                        <tr key={a.sym} className="border-b border-outline-variant/10 hover:bg-surface-container-high/30 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <span className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold border border-outline-variant/30" style={{ background: a.color + "18", color: a.color }}>{a.sym.slice(0, 1)}</span>
                              <div>
                                <div className="font-data-sm text-data-sm text-on-surface">{a.sym}</div>
                                <div className="font-data-sm text-[11px] text-on-surface-variant">{a.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-right font-data-sm text-data-sm text-on-surface tabular">{a.pct}%</td>
                          <td className="p-4 text-right font-data-sm text-data-sm text-on-surface tabular">{D.fmtUSD(a.value)}</td>
                          <td className="p-4 text-right font-data-sm text-data-sm text-emerald tabular">{a.apy > 0 ? a.apy + "%" : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </div>

            {/* Positions */}
            <Panel className="p-0 overflow-hidden">
              <div className="p-6 border-b border-outline-variant/10">
                <h3 className="font-headline-md text-headline-md text-on-surface">Active Positions</h3>
                <p className="font-data-sm text-data-sm text-on-surface-variant mt-1">Strategies executed by sub-delegated agents</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant/20 bg-surface-container-lowest/50 font-label-caps text-label-caps text-on-surface-variant">
                      <th className="p-4 font-normal">Protocol</th>
                      <th className="p-4 font-normal">Action</th>
                      <th className="p-4 font-normal">Agent</th>
                      <th className="p-4 font-normal text-right">Value</th>
                      <th className="p-4 font-normal text-right">APY</th>
                      <th className="p-4 font-normal">Range</th>
                    </tr>
                  </thead>
                  <tbody className="font-data-sm text-data-sm">
                    {D.positions.map((p, i) => (
                      <tr key={i} className="border-b border-outline-variant/10 hover:bg-surface-container-high/30 transition-colors">
                        <td className="p-4 text-on-surface">{p.protocol}</td>
                        <td className="p-4 text-on-surface-variant">{p.action}</td>
                        <td className="p-4 text-on-surface-variant">{p.agent}</td>
                        <td className="p-4 text-right tabular">{D.fmtUSD(p.amount, 2)}</td>
                        <td className="p-4 text-right tabular text-emerald">{p.apy > 0 ? p.apy + "%" : "—"}</td>
                        <td className="p-4">
                          {p.range ? (
                            <span className={
                              "font-label-caps text-[11px] px-2 py-0.5 rounded border " +
                              (p.range === "in range"
                                ? "text-emerald border-emerald/30 bg-emerald/5"
                                : "text-on-surface-variant border-outline-variant/30")
                            }>{p.range}</span>
                          ) : <span className="text-on-surface-variant">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        )}

        {/* ── AGENTS ───────────────────────────────────────────────── */}
        {tab === "agents" && (
          <div className="space-y-gutter fade-up">
            {D.agents.map((a) => (
              <Panel key={a.id} glow={a.id === "cio"} className="p-6 relative overflow-hidden">
                {a.id === "cio" && (
                  <div className="absolute top-0 right-0 opacity-[0.06] pointer-events-none">
                    <Icon name="neurology" className="text-[160px]" />
                  </div>
                )}
                <div className="grid lg:grid-cols-12 gap-6 relative z-10">
                  <div className="lg:col-span-7">
                    <div className="flex items-start gap-4">
                      <span className={
                        "w-12 h-12 rounded-lg flex items-center justify-center shrink-0 border " +
                        (a.id === "cio"
                          ? "bg-surface-container border-amber/30"
                          : "bg-surface-container border-outline-variant/20")
                      }>
                        <Icon name={a.icon} className={"text-[26px] " + (a.id === "cio" ? "text-amber" : "text-secondary-fixed-dim")} />
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-headline-md text-[20px] text-on-surface">{a.name}</h3>
                          <AgentStatus status={a.status as "deciding" | "swapping" | "active" | "idle"} />
                          <Tag>{a.kind}</Tag>
                        </div>
                        <p className="font-data-sm text-data-sm text-on-surface-variant mt-2 max-w-lg">{a.desc}</p>
                        <div className="flex gap-2 mt-3 flex-wrap">
                          <Tag>{a.model}</Tag>
                          <Tag>{a.provider}</Tag>
                          {a.limit && <Tag className="text-amber border-amber/30">{a.limit}</Tag>}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="lg:col-span-5 grid grid-cols-2 gap-4 lg:border-l border-outline-variant/15 lg:pl-6">
                    <div>
                      <Label className="mb-1.5">Executions</Label>
                      <div className="font-data-lg text-[22px] text-on-surface tabular">{a.executed.toLocaleString()}</div>
                    </div>
                    <div>
                      <Label className="mb-1.5">Success rate</Label>
                      <div className="font-data-lg text-[22px] text-emerald tabular">{a.success}%</div>
                    </div>
                    <div className="col-span-2">
                      <Label className="mb-2">Caveats</Label>
                      <div className="space-y-1.5">
                        {a.caveats.map((c) => (
                          <div key={c} className="flex items-center gap-2 font-data-sm text-[12px] text-on-surface-variant">
                            <Icon name="check_circle" className="text-emerald text-[14px] shrink-0" />
                            {c}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Panel>
            ))}
          </div>
        )}

        {/* ── PERMISSIONS ──────────────────────────────────────────── */}
        {tab === "permissions" && (
          <div className="space-y-gutter fade-up">
            {/* Master permission */}
            <Panel glow className="p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 opacity-[0.06] pointer-events-none">
                <Icon name="verified_user" className="text-[150px]" />
              </div>
              <div className="grid lg:grid-cols-12 gap-8 relative z-10">
                <div className="lg:col-span-7">
                  <PanelHead
                    title="Master Operating Permission"
                    sub="Granted by owner via wallet_grantPermissions"
                    live
                    right={<Tag>ERC-7715</Tag>}
                  />
                  <div className="flex justify-between font-data-sm text-data-sm mb-2 mt-4">
                    <span className="text-on-surface">Budget consumed</span>
                    <span className="text-primary-container">
                      {usedPct}% · {D.fmtUSD(t.masterUsed)} of {D.fmtUSD(t.masterBudget)}
                    </span>
                  </div>
                  <Bar pct={usedPct} h="h-1.5" shimmer />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                    {[["Token", "USDC"], ["Network", "Base"], ["Period", "Monthly"], ["Resets", "in 12d"]].map(([l, v]) => (
                      <div key={l}>
                        <Label className="mb-1.5 normal-case">{l}</Label>
                        <div className="font-data-sm text-data-sm text-on-surface">{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="lg:col-span-5 lg:border-l border-outline-variant/15 lg:pl-8 space-y-4">
                  <Label>Permission Context</Label>
                  <div className="bg-surface-container-lowest/70 border border-outline-variant/15 rounded-lg p-3 font-data-sm text-[12px] text-on-surface-variant space-y-1.5">
                    {[
                      ["delegator", D.user.address],
                      ["delegate", "0xDeleg…7710"],
                      ["scope", "Erc20Periodic"],
                      ["enforcer", "AllowedTargets"],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span>{k}</span>
                        <span className="text-on-surface">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Panel>

            {/* Allocation summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-gutter">
              {[
                { l: "Active Delegations", v: "4", icon: "key", c: "text-on-surface" },
                { l: "Total Delegated", v: D.fmtUSD(totalDelegated), icon: "savings", c: "text-on-surface" },
                { l: "Spent this period", v: D.fmtUSD(t.masterUsed), icon: "payments", c: "text-primary" },
                { l: "Headroom", v: D.fmtUSD(t.masterBudget - t.masterUsed), icon: "data_usage", c: "text-emerald" },
              ].map((k) => (
                <Panel key={k.l} className="p-5">
                  <div className="flex items-center justify-between">
                    <Label>{k.l}</Label>
                    <Icon name={k.icon} className="text-on-surface-variant text-[18px]" />
                  </div>
                  <div className={"font-data-lg text-[24px] mt-3 tabular " + k.c}>{k.v}</div>
                </Panel>
              ))}
            </div>

            {/* Burner keys */}
            <Panel className="p-0 overflow-hidden">
              <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center">
                <div>
                  <h3 className="font-headline-md text-headline-md text-on-surface">Sub-Delegations</h3>
                  <p className="font-data-sm text-data-sm text-on-surface-variant mt-1">
                    Burner keys bound by caveat · ERC-7710 redelegatePermissionContext
                  </p>
                </div>
                <Tag>5 KEYS</Tag>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant/20 bg-surface-container-lowest/50 font-label-caps text-label-caps text-on-surface-variant">
                      <th className="p-4 font-normal">Agent / Burner Key</th>
                      <th className="p-4 font-normal">Allowed Target</th>
                      <th className="p-4 font-normal">Caveat</th>
                      <th className="p-4 font-normal w-48">Spent / Limit</th>
                      <th className="p-4 font-normal">Expires</th>
                      <th className="p-4 font-normal text-right">State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {D.burnerKeys.map((k, i) => {
                      const pct = Math.round((k.used / k.limit) * 100);
                      const revoked = k.status === "revoked";
                      return (
                        <tr key={i} className={"border-b border-outline-variant/10 " + (revoked ? "opacity-50" : "hover:bg-surface-container-high/30 transition-colors")}>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded bg-surface-container flex items-center justify-center border border-outline-variant/20">
                                <Icon name={k.icon} className="text-[15px] text-secondary-fixed-dim" />
                              </span>
                              <div>
                                <div className="font-data-sm text-data-sm text-on-surface">{k.agent}</div>
                                <div className="font-data-sm text-[12px] text-on-surface-variant">{k.address}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-data-sm text-data-sm text-on-surface-variant">{k.target}</td>
                          <td className="p-4">
                            <span className="font-data-sm text-[12px] text-tertiary-fixed-dim bg-tertiary-fixed-dim/10 px-2 py-1 rounded border border-tertiary-fixed-dim/20">
                              {k.scope}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex justify-between font-data-sm text-[12px] mb-1.5 tabular">
                              <span className="text-on-surface">{D.fmtUSD(k.used)}</span>
                              <span className="text-on-surface-variant">{D.fmtUSD(k.limit)}</span>
                            </div>
                            <Bar
                              pct={pct}
                              color={revoked ? "bg-error" : pct >= 100 ? "bg-amber" : "bg-primary-container"}
                            />
                          </td>
                          <td className="p-4 font-data-sm text-data-sm text-on-surface-variant">{k.expires}</td>
                          <td className="p-4 text-right">
                            {revoked ? (
                              <span className="font-label-caps text-label-caps text-error">REVOKED</span>
                            ) : (
                              <span className="font-label-caps text-label-caps text-on-surface-variant">ACTIVE</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        )}

        {/* ── ACTIVITY ─────────────────────────────────────────────── */}
        {tab === "activity" && (
          <div className="space-y-gutter fade-up">
            {/* Relayer stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-gutter">
              {[
                { l: "Relayer", v: D.relayer.provider, sub: D.relayer.standard, icon: "bolt", c: "text-primary" },
                { l: "Txns sponsored", v: D.relayer.sponsored.toLocaleString(), sub: D.fmtUSD(D.relayer.sponsoredUsd, 2) + " gas", icon: "local_gas_station", c: "text-on-surface" },
                { l: "Avg gas price", v: D.relayer.gasPrice, sub: "Base · paid in USDC", icon: "speed", c: "text-on-surface" },
                { l: "Success rate", v: "98.4%", sub: "Last 1,000 tx", icon: "check_circle", c: "text-emerald" },
              ].map((k) => (
                <Panel key={k.l} className="p-5">
                  <div className="flex items-center justify-between">
                    <Label>{k.l}</Label>
                    <Icon name={k.icon} className="text-on-surface-variant text-[18px]" />
                  </div>
                  <div className={"font-data-lg text-[22px] mt-3 tabular " + k.c}>{k.v}</div>
                  <div className="font-data-sm text-[12px] text-on-surface-variant mt-1">{k.sub}</div>
                </Panel>
              ))}
            </div>

            {/* Full activity table */}
            <Panel className="p-0 overflow-hidden">
              <div className="p-5 border-b border-outline-variant/10 flex items-center justify-between">
                <div>
                  <h3 className="font-headline-md text-headline-md text-on-surface">Activity & Relayer</h3>
                  <p className="font-data-sm text-[12px] text-on-surface-variant mt-0.5">Demo trades — not real transactions</p>
                </div>
                <Tag>DEMO · {D.activity.length} TXNS</Tag>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant/20 bg-surface-container-lowest/50 font-label-caps text-label-caps text-on-surface-variant">
                      <th className="p-4 font-normal">Time</th>
                      <th className="p-4 font-normal">Asset / Route</th>
                      <th className="p-4 font-normal">Agent</th>
                      <th className="p-4 font-normal">Relayer Task</th>
                      <th className="p-4 font-normal text-right">Amount</th>
                      <th className="p-4 font-normal">Gas</th>
                      <th className="p-4 font-normal">Status</th>
                    </tr>
                  </thead>
                  <tbody className="font-data-sm text-data-sm">
                    {D.activity.map((a) => (
                      <tr key={a.id} className={"border-b border-outline-variant/10 hover:bg-surface-container-high/30 transition-colors " + (a.status === "confirmed" ? "bg-primary-container/[0.03]" : "")}>
                        <td className="p-4 text-outline tabular">{a.time}</td>
                        <td className="p-4">
                          <RouteCell from={a.from} to={a.to} />
                          <div className="text-on-surface-variant text-[12px] mt-1">{a.venue}</div>
                        </td>
                        <td className="p-4 text-on-surface-variant">{a.agent}</td>
                        <td className="p-4 text-tertiary-fixed-dim">{a.task}</td>
                        <td className="p-4 text-on-surface text-right tabular">{D.fmtUSD(a.amount, 2)}</td>
                        <td className="p-4 text-on-surface-variant tabular">{a.gas > 0 ? "$" + a.gas.toFixed(2) : "—"}</td>
                        <td className="p-4"><TxStatus status={a.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        )}

        {/* ── CIO TERMINAL ─────────────────────────────────────────── */}
        {tab === "terminal" && (
          <div className="space-y-gutter fade-up">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-gutter">
              {[
                { l: "Intents emitted", v: "1,284", sub: "all time", icon: "neurology", c: "text-on-surface" },
                { l: "Execution rate", v: "99.2%", sub: "intents → confirmed", icon: "check_circle", c: "text-emerald" },
                { l: "Avg intent size", v: "$48,200", sub: "USDC", icon: "attach_money", c: "text-primary" },
                { l: "Model", v: "Llama 3.3", sub: "Venice AI · 70B", icon: "smart_toy", c: "text-primary-fixed-dim" },
              ].map((k) => (
                <Panel key={k.l} className="p-5">
                  <div className="flex items-center justify-between">
                    <Label>{k.l}</Label>
                    <Icon name={k.icon} className="text-on-surface-variant text-[18px]" />
                  </div>
                  <div className={"font-data-lg text-[22px] mt-3 tabular " + k.c}>{k.v}</div>
                  <div className="font-data-sm text-[12px] text-on-surface-variant mt-1">{k.sub}</div>
                </Panel>
              ))}
            </div>

            <Panel className="p-0 overflow-hidden border border-outline-variant/30">
              <div className="p-4 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-highest/40">
                <h3 className="font-data-lg text-data-lg text-on-surface flex items-center gap-2">
                  <Icon name="neurology" className="text-primary-container text-[18px]" />
                  CIO Agent · Reasoning Trace
                </h3>
                <Tag className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-amber circle pulse-amber inline-block" />
                  Llama 3.3 / Venice AI
                </Tag>
              </div>
              <div className="p-5 bg-surface-container-lowest/80 font-data-sm text-data-sm text-on-surface-variant space-y-3">
                {D.cioLog.map((l, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-outline shrink-0">[{l.t}]</span>
                    <span>
                      <span className={(KIND_COLOR[l.kind] || "") + " font-bold"}>{l.kind}: </span>
                      <span className={l.kind === "REASONING" || l.kind === "INTENT" ? "text-on-surface" : ""}>{l.text}</span>
                    </span>
                  </div>
                ))}
                <div className="flex gap-2 items-center mt-2">
                  <span className="text-outline">&gt;</span>
                  <span className="w-1.5 h-3.5 bg-primary-container inline-block blink" />
                </div>
              </div>
            </Panel>

            {/* Delegation flow */}
            <Panel className="p-6">
              <Label className="mb-5">A2A Delegation Flow · ERC-7710</Label>
              <div className="flex items-center gap-3 overflow-x-auto pb-1">
                {[
                  { i: "person", t: "Owner EOA", s: D.user.address },
                  { i: "neurology", t: "CIO Agent", s: "Reasoning" },
                  { i: "vpn_key", t: "Caveat Builder", s: "redelegate" },
                  { i: "swap_horiz", t: "Swap Agent", s: "Burner key" },
                  { i: "bolt", t: "1Shot Relayer", s: "Gas-abstracted" },
                  { i: "check_circle", t: "Confirmed", s: "On-chain" },
                ].map((node, idx, arr) => (
                  <div key={node.t} className="flex items-center gap-3">
                    <div className="flex flex-col items-center text-center min-w-[90px]">
                      <span className={
                        "w-10 h-10 rounded-lg flex items-center justify-center border " +
                        (idx === arr.length - 1
                          ? "bg-primary-container/10 border-primary-container/40 neon-glow"
                          : "bg-surface-container border-outline-variant/20")
                      }>
                        <Icon
                          name={node.i}
                          className={"text-[20px] " + (idx === arr.length - 1 ? "text-primary-fixed-dim" : "text-on-surface-variant")}
                        />
                      </span>
                      <span className="font-data-sm text-[12px] text-on-surface mt-2">{node.t}</span>
                      <span className="font-data-sm text-[11px] text-outline">{node.s}</span>
                    </div>
                    {idx < arr.length - 1 && (
                      <Icon name="arrow_forward" className="text-outline text-[18px] shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        )}
      </div>
    </div>
  );
}
