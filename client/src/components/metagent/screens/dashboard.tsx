"use client";

import { useState, useEffect } from "react";
import { Icon, Panel, PanelHead, Label, Tag, Btn, IconBtn, TxStatus, RouteCell } from "../primitives";
import { AreaChart, Bar } from "../charts";
import * as D from "@/lib/data";
import { triggerTrade } from "@/lib/api";

export function Dashboard({ nav, openTx, userId }: { nav: (r: string) => void; openTx: (tx: typeof D.activity[0]) => void; userId: string | null }) {
  const t = D.treasury;
  const usedPct = Math.round((t.masterUsed / t.masterBudget) * 100);

  return (
    <div className="space-y-gutter">
      {/* Top row */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter">
        {/* Treasury */}
        <Panel glow className="xl:col-span-8 p-6 flex flex-col justify-between relative overflow-hidden min-h-[360px]">
          <div className="absolute top-0 right-0 p-4 opacity-[0.07] pointer-events-none">
            <Icon name="account_balance" className="text-[150px]" />
          </div>
          <PanelHead
            title="Autonomous Treasury"
            sub="Real-time portfolio valuation across networks"
            live
            right={<IconBtn name="more_vert" />}
          />
          <div className="relative z-[1] flex-1 -mx-2 flex items-end">
            <AreaChart data={t.equity} h={150} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10 mt-2">
            <div>
              <Label className="mb-2">Total Value Locked (TVL)</Label>
              <div className="font-display-lg text-display-lg text-primary tracking-tight tabular">
                $12,450,892
                <span className="text-primary/50 text-headline-md">.45</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="flex items-center text-primary-container font-data-sm text-data-sm bg-primary-container/10 px-2 py-0.5 rounded">
                  <Icon name="trending_up" className="text-[15px] mr-1" /> +{t.change24hPct}%
                </span>
                <span className="font-data-sm text-data-sm text-on-surface-variant">vs 24h</span>
              </div>
            </div>
            <div className="border-t md:border-t-0 md:border-l border-outline-variant/20 pt-4 md:pt-0 md:pl-8">
              <Label className="mb-2">24h PnL</Label>
              <div className="font-headline-md text-headline-md text-primary-fixed-dim tabular">
                +{D.fmtUSD(t.pnl24h, 2)}
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between font-data-sm text-data-sm">
                  <span className="text-on-surface-variant">Yield Generation</span>
                  <span className="text-on-surface tabular">+{D.fmtUSD(t.yieldGen)}</span>
                </div>
                <div className="flex justify-between font-data-sm text-data-sm">
                  <span className="text-on-surface-variant">Active Trading</span>
                  <span className="text-primary-container tabular">+{D.fmtUSD(t.activeTrading)}</span>
                </div>
              </div>
            </div>
          </div>
        </Panel>

        <CIOTerminal className="xl:col-span-4" onOpenAgents={() => nav("agents")} userId={userId} />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Permissions */}
        <Panel className="lg:col-span-5 p-6 flex flex-col">
          <PanelHead title="Permissions & Budget" right={<Tag>ERC-7715</Tag>} />
          <div className="space-y-6 flex-1">
            <div>
              <div className="flex justify-between font-data-sm text-data-sm mb-2">
                <span className="text-on-surface">Master Operating Budget</span>
                <span className="text-primary-container">{usedPct}% Used</span>
              </div>
              <Bar pct={usedPct} shimmer />
              <div className="flex justify-between font-data-sm text-data-sm mt-1.5 text-on-surface-variant tabular">
                <span>{D.fmtUSD(t.masterUsed)}</span>
                <span>{D.fmtUSD(t.masterBudget)}</span>
              </div>
            </div>
            <div className="pt-4 border-t border-outline-variant/10">
              <Label className="mb-4">Active Burner Keys</Label>
              <div className="space-y-3">
                {D.burnerKeys.filter((k) => k.status === "active").slice(0, 3).map((k) => (
                  <button
                    key={k.address}
                    onClick={() => nav("permissions")}
                    className="w-full flex items-center justify-between group hover:bg-surface-container-high/30 -mx-2 px-2 py-1.5 rounded transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded bg-surface-container flex items-center justify-center border border-outline-variant/20">
                        <Icon name={k.icon} className="text-[16px] text-secondary-fixed-dim" />
                      </span>
                      <div className="text-left">
                        <p className="font-data-sm text-data-sm text-on-surface">{k.agent}</p>
                        <p className="font-label-caps text-label-caps text-on-surface-variant normal-case">
                          Limit: ${k.limit >= 1000 ? k.limit / 1000 + "k" : k.limit} /{" "}
                          {k.agent.includes("LP") || k.agent.includes("Yield") ? "day" : "tx"}
                        </p>
                      </div>
                    </div>
                    <span className="font-data-sm text-data-sm text-primary-container">Active</span>
                  </button>
                ))}
              </div>
              <Btn
                variant="ghost"
                className="w-full mt-4"
                icon="vpn_key"
                onClick={() => nav("permissions")}
              >
                Manage Permissions
              </Btn>
            </div>
          </div>
        </Panel>

        {/* Live activity */}
        <Panel className="lg:col-span-7 p-0 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center">
            <h3 className="font-headline-md text-headline-md text-on-surface">Live Activity</h3>
            <button
              onClick={() => nav("activity")}
              className="font-data-sm text-data-sm text-on-surface-variant hover:text-primary-fixed-dim transition-colors flex items-center gap-1"
            >
              View All <Icon name="arrow_forward" className="text-[15px]" />
            </button>
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
                  <tr
                    key={a.id}
                    onClick={() => openTx(a)}
                    className={
                      "border-b border-outline-variant/10 hover:bg-surface-container-high/30 transition-colors cursor-pointer " +
                      (a.status === "confirmed" ? "bg-primary-container/[0.04]" : "")
                    }
                  >
                    <td className="p-4">
                      <RouteCell from={a.from} to={a.to} />
                      <div className="text-on-surface-variant text-[12px] mt-1">
                        {a.venue}
                        {a.action !== "Swap" ? " · " + a.action : ""}
                      </div>
                    </td>
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
    </div>
  );
}

function CIOTerminal({ className = "", onOpenAgents, userId }: { className?: string; onOpenAgents: () => void; userId: string | null }) {
  const [n, setN] = useState(3);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<{ taskId: string; intent: { target: string; amount_usdc: number } } | null>(null);
  const [runError, setRunError] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setN((v) => (v < D.cioLog.length ? v + 1 : v)), 1400);
    return () => clearInterval(id);
  }, []);

  const handleRunAgent = async () => {
    if (!userId || running) return;
    setRunning(true);
    setRunError(null);
    setRunResult(null);
    try {
      const result = await triggerTrade(userId);
      setRunResult({ taskId: result.taskId, intent: result.intent as { target: string; amount_usdc: number } });
    } catch (e) {
      setRunError(String(e));
    } finally {
      setRunning(false);
    }
  };

  const KIND: Record<string, string> = {
    INFO: "text-tertiary-fixed-dim",
    REASONING: "text-primary-container",
    ACTION: "text-secondary-fixed-dim",
    INTENT: "text-amber",
    RELAY: "text-violet",
  };

  return (
    <Panel className={"p-0 flex flex-col border border-outline-variant/30 overflow-hidden " + className}>
      <div className="p-4 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-highest/40">
        <h3 className="font-data-lg text-data-lg text-on-surface flex items-center gap-2">
          <Icon name="neurology" className="text-primary-container text-[18px]" />
          Active CIO Agent
        </h3>
        <Tag className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-amber circle pulse-amber inline-block" />
          Llama 3.3 / Venice AI
        </Tag>
      </div>
      <div className="flex-1 p-4 bg-surface-container-lowest/80 font-data-sm text-data-sm text-on-surface-variant overflow-y-auto max-h-[300px] xl:max-h-none flex flex-col gap-2.5">
        {D.cioLog.slice(0, n).map((l, i) => (
          <div key={i} className={"flex gap-2 fade-up " + (i < n - 3 ? "opacity-60" : "")}>
            <span className="text-outline shrink-0">[{l.t}]</span>
            <span>
              <span className={(KIND[l.kind] || "") + " font-bold"}>{l.kind}: </span>
              <span className={l.kind === "REASONING" || l.kind === "INTENT" ? "text-on-surface" : ""}>
                {l.text}
              </span>
            </span>
          </div>
        ))}
        <div className="flex gap-2 items-center mt-1">
          <span className="text-outline">&gt;</span>
          <span className="w-1.5 h-3.5 bg-primary-container inline-block blink" />
        </div>
      </div>
      {runResult && (
        <div className="px-4 pb-3 font-data-sm text-[12px] text-primary-container bg-primary-container/5 border-t border-primary-container/20 py-2 space-y-1">
          <p className="flex items-center gap-1.5"><Icon name="check_circle" className="text-emerald text-[14px]" /> Intent submitted · task {runResult.taskId.slice(0, 12)}…</p>
          <p className="text-on-surface-variant">Target: {runResult.intent.target} · ${runResult.intent.amount_usdc.toLocaleString()} USDC</p>
        </div>
      )}
      {runError && (
        <div className="px-4 pb-3 font-data-sm text-[12px] text-error bg-error/5 border-t border-error/20 py-2">
          {runError}
        </div>
      )}
      <div className="border-t border-outline-variant/20 flex">
        <button
          onClick={handleRunAgent}
          disabled={!userId || running}
          className="flex-1 p-3 font-data-sm text-data-sm text-primary-container hover:bg-primary-container/10 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed border-r border-outline-variant/20"
        >
          {running
            ? <><span className="w-3 h-3 rounded-full border-2 border-primary-container border-t-transparent animate-spin" /> Running…</>
            : <><Icon name="play_arrow" className="text-[16px]" /> Run Agent</>
          }
        </button>
        <button
          onClick={onOpenAgents}
          className="flex-1 p-3 font-data-sm text-data-sm text-on-surface-variant hover:text-primary-fixed-dim transition-colors flex items-center justify-center gap-1.5"
        >
          Console <Icon name="open_in_new" className="text-[14px]" />
        </button>
      </div>
    </Panel>
  );
}
