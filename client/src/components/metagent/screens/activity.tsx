"use client";

import { useState, useEffect } from "react";
import { Icon, Panel, Label, Btn, IconBtn, TxStatus, MonoAddr, RouteCell } from "../primitives";
import * as D from "@/lib/data";
import { fetchTrades, type LiveTrade } from "@/lib/api";

type TxItem = typeof D.activity[0];

const STATUS_MAP: Record<LiveTrade["status"], D.TxStatus> = {
  PENDING: "estimating",
  SUBMITTED: "pending",
  CONFIRMED: "confirmed",
  REVERTED: "reverted",
};

function liveToRow(t: LiveTrade): TxItem {
  return {
    id: t.id,
    from: "USDC",
    to: t.cioPromptJson.target,
    venue: "Uniswap v3",
    action: "Swap",
    agent: "CIO Agent → Swap Agent",
    amount: t.cioPromptJson.amount_usdc,
    status: STATUS_MAP[t.status],
    time: new Date(t.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    task: t.relayerTaskId ?? "—",
    gas: 0,
  };
}

function exportCSV(rows: TxItem[]) {
  const header = "Time,Route,Agent,Task,Amount (USDC),Status\n";
  const body = rows.map((r) =>
    `${r.time},${r.from}→${r.to},${r.agent},${r.task},${r.amount},${r.status}`
  ).join("\n");
  const blob = new Blob([header + body], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `metagent-activity-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function Activity({ openTx, userId }: { openTx: (tx: TxItem) => void; userId: string | null }) {
  const [filter, setFilter] = useState("All");
  const [liveTrades, setLiveTrades] = useState<TxItem[]>([]);
  const filters = ["All", "Estimating", "Signed", "Confirmed", "Submitted", "Reverted"];
  const map: Record<string, string> = {
    Estimating: "estimating",
    Signed: "signed",
    Confirmed: "confirmed",
    Submitted: "pending",
    Reverted: "reverted",
  };

  // Initial fetch
  useEffect(() => {
    if (!userId) return;
    fetchTrades(userId).then((trades) => setLiveTrades(trades.map(liveToRow))).catch(() => {});
  }, [userId]);

  // Poll for trade status updates every 5 seconds
  useEffect(() => {
    if (!userId) return;
    const interval = setInterval(() => {
      fetchTrades(userId).then((trades) => setLiveTrades(trades.map(liveToRow))).catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [userId]);

  const allRows = [...liveTrades];
  const rows = filter === "All" ? allRows : allRows.filter((a) => a.status === map[filter]);

  return (
    <div className="space-y-gutter">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface">Activity & Relayer</h2>
          <p className="font-data-sm text-data-sm text-on-surface-variant mt-1">
            Every agent execution, routed gas-abstracted through 1Shot
          </p>
        </div>
        <Btn variant="ghost" icon="download" onClick={() => exportCSV(allRows)}>Export CSV</Btn>
      </div>

      {/* Relayer summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-gutter">
        {[
          { l: "Relayer", v: "1Shot", sub: "ERC-7710 / EIP-7715", icon: "bolt", c: "text-primary" },
          { l: "Agent trades", v: allRows.length.toLocaleString(), sub: "this session", icon: "local_gas_station", c: "text-on-surface" },
          { l: "Gas abstraction", v: "x402", sub: "Base · USDC settlement", icon: "speed", c: "text-on-surface" },
          { l: "Confirmed", v: String(allRows.filter((t) => t.status === "confirmed").length), sub: `of ${allRows.length} total`, icon: "check_circle", c: "text-emerald" },
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

      <Panel className="p-0 overflow-hidden">
        <div className="p-5 border-b border-outline-variant/10 flex items-center gap-2 flex-wrap">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={
                "font-label-caps text-label-caps px-3 py-2 rounded transition-colors " +
                (filter === f
                  ? "bg-primary-container/10 text-primary-container ring-1 ring-primary-container/30"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high")
              }
            >
              {f}
            </button>
          ))}
          <div className="ml-auto font-data-sm text-data-sm text-on-surface-variant">
            {rows.length} txns
          </div>
        </div>
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Icon name="receipt_long" className="text-[40px] text-on-surface-variant/30 mb-3" />
            <p className="font-data-sm text-data-sm text-on-surface-variant">No trades yet.</p>
            <p className="font-data-sm text-[12px] text-outline mt-1">Run the CIO Agent from the Dashboard to generate your first trade intent.</p>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/20 bg-surface-container-lowest/50 font-label-caps text-label-caps text-on-surface-variant">
                <th className="p-4 font-normal">Time</th>
                <th className="p-4 font-normal">Asset / Route</th>
                <th className="p-4 font-normal">Agent</th>
                <th className="p-4 font-normal">Relayer Task</th>
                <th className="p-4 font-normal text-right">Amount</th>
                <th className="p-4 font-normal">Status</th>
              </tr>
            </thead>
            <tbody className="font-data-sm text-data-sm">
              {rows.map((a) => (
                <tr
                  key={a.id}
                  onClick={() => openTx(a)}
                  className={
                    "border-b border-outline-variant/10 hover:bg-surface-container-high/30 transition-colors cursor-pointer " +
                    (a.status === "confirmed" ? "bg-primary-container/[0.03]" : "")
                  }
                >
                  <td className="p-4 text-outline tabular">{a.time}</td>
                  <td className="p-4">
                    <RouteCell from={a.from} to={a.to} />
                    <div className="text-on-surface-variant text-[12px] mt-1">
                      {a.venue}
                      {a.action !== "Swap" ? " · " + a.action : ""}
                    </div>
                  </td>
                  <td className="p-4 text-on-surface-variant">{a.agent}</td>
                  <td className="p-4 text-tertiary-fixed-dim">{a.task}</td>
                  <td className="p-4 text-on-surface text-right tabular">{D.fmtUSD(a.amount, 2)}</td>
                  <td className="p-4"><TxStatus status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </Panel>
    </div>
  );
}

export function TxDrawer({ tx, onClose }: { tx: TxItem | null; onClose: () => void }) {
  if (!tx) return null;
  const order = ["estimating", "signed", "pending", "confirmed"];
  const reverted = tx.status === "reverted";
  const curIdx = reverted ? 1 : order.indexOf(tx.status);
  const steps = [
    { key: "estimating", label: "Estimating", sub: "1Shot relayer_estimate7710", icon: "calculate" },
    { key: "signed", label: "Signed", sub: "Sub-delegation + salt", icon: "draw" },
    { key: "pending", label: "Submitted", sub: "Pushed to public relayer", icon: "send" },
    { key: "confirmed", label: "Confirmed", sub: "Webhook → on-chain", icon: "check_circle" },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex justify-end" onClick={onClose}>
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm fade-up"
        style={{ animationDuration: ".2s" }}
      />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative glass-panel w-full max-w-md h-full overflow-y-auto fade-up border-l border-outline-variant/20"
        style={{ animationDuration: ".25s" }}
      >
        <div className="sticky top-0 z-10 glass-deep p-5 border-b border-outline-variant/15 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-lg bg-surface-container border border-outline-variant/20 flex items-center justify-center">
              <Icon name="receipt_long" className="text-primary-fixed-dim text-[20px]" />
            </span>
            <div>
              <h3 className="font-data-lg text-data-lg text-on-surface">
                {tx.action} · {tx.from}→{tx.to}
              </h3>
              <p className="font-data-sm text-[12px] text-on-surface-variant">
                {tx.venue} · {tx.time}
              </p>
            </div>
          </div>
          <IconBtn name="close" onClick={onClose} />
        </div>

        <div className="p-5 space-y-7">
          <div className="bg-surface-container-lowest/60 border border-outline-variant/15 rounded-lg p-5 text-center">
            <Label className="mb-2">Trade Size</Label>
            <div className="font-data-lg text-[28px] text-on-surface tabular">{D.fmtUSD(tx.amount, 2)}</div>
            <div className="mt-2"><TxStatus status={tx.status} /></div>
          </div>

          {/* Stage tracker */}
          <div>
            <Label className="mb-4">Relayer Pipeline · 1Shot</Label>
            <div className="space-y-0">
              {steps.map((s, i) => {
                const reachedRevert = reverted && i <= 1;
                const reached = !reverted && i <= curIdx;
                const active = !reverted && i === curIdx && tx.status !== "confirmed";
                const last = i === steps.length - 1;
                const done = reached || reachedRevert;
                return (
                  <div key={s.key} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={
                          "w-8 h-8 circle flex items-center justify-center border transition-colors " +
                          (active
                            ? "border-primary-container bg-primary-container/10 neon-glow"
                            : done
                            ? s.key === "confirmed"
                              ? "border-primary-container bg-primary-container text-on-primary-container neon-glow"
                              : "border-secondary-fixed-dim bg-secondary-fixed-dim/15 text-secondary-fixed-dim"
                            : "border-outline-variant/40 text-outline")
                        }
                      >
                        <Icon
                          name={s.icon}
                          className={"text-[16px] " + (active ? "text-primary-fixed-dim" : "")}
                        />
                      </span>
                      {!last && (
                        <span
                          className={
                            "w-0.5 flex-1 min-h-[28px] " +
                            (i < curIdx && !reverted ? "bg-secondary-fixed-dim/40" : "bg-outline-variant/30")
                          }
                        />
                      )}
                    </div>
                    <div className={"pb-6 " + (done ? "" : "opacity-50")}>
                      <div
                        className={
                          "font-data-sm text-data-sm " +
                          (active
                            ? "text-primary-container"
                            : done
                            ? "text-on-surface"
                            : "text-on-surface-variant")
                        }
                      >
                        {s.label}
                        {active && " · in progress"}
                      </div>
                      <div className="font-data-sm text-[12px] text-on-surface-variant mt-0.5">{s.sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            {reverted && (
              <div className="flex items-start gap-2.5 bg-error/10 border border-error/30 rounded-lg p-3 mt-1">
                <Icon name="error" className="text-error text-[16px] mt-0.5" />
                <div>
                  <div className="font-data-sm text-data-sm text-error">Reverted</div>
                  <div className="font-data-sm text-[12px] text-on-error-container/80 mt-0.5">
                    {tx.note} · gas refunded by relayer
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <Label className="mb-3">Execution Detail</Label>
            <div className="bg-surface-container-lowest/60 border border-outline-variant/15 rounded-lg divide-y divide-outline-variant/10">
              {[
                ["Agent", tx.agent],
                ["Relayer task", tx.task],
                ["Venue", tx.venue],
                ["Gas (sponsored)", tx.gas > 0 ? "$" + tx.gas.toFixed(2) : "—"],
                ["Tx hash", tx.tx || "pending"],
                ["Caveat", "ERC20TransferAmount · AllowedTargets"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between px-4 py-3">
                  <span className="font-data-sm text-data-sm text-on-surface-variant">{k}</span>
                  {k === "Tx hash" && tx.tx ? (
                    <MonoAddr>{v}</MonoAddr>
                  ) : (
                    <span className="font-data-sm text-data-sm text-on-surface">{v}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Btn
              variant="ghost"
              className="flex-1"
              iconEnd="open_in_new"
              onClick={() => {
                const target = tx.tx
                  ? `https://basescan.org/tx/${tx.tx}`
                  : tx.task && tx.task !== "—"
                  ? `https://basescan.org/search?q=${tx.task}`
                  : null;
                if (target) window.open(target, "_blank");
              }}
            >
              View on Basescan
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
