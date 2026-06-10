"use client";

import { useState, useEffect } from "react";
import { Icon, Panel, Label, Tag, Btn, AgentStatus } from "../primitives";
import { fetchTrades } from "@/lib/api";

const CIO = {
  id: "cio",
  name: "CIO Agent",
  role: "Chief Investment Officer",
  model: "Llama 3.3 70B",
  provider: "Venice AI",
  icon: "neurology",
  desc: "Analyzes market data and emits strict-JSON trade intents. Delegates execution to swap agents via redelegatePermissionContext.",
  caveats: ["Read-only market access", "Emits intents only — no signing keys"],
};

export function Agents({ nav, userId }: { nav: (r: string) => void; userId: string | null }) {
  const [tradeCount, setTradeCount] = useState<number | null>(null);
  const [confirmedCount, setConfirmedCount] = useState<number>(0);

  useEffect(() => {
    if (!userId) return;
    fetchTrades(userId)
      .then((trades) => {
        setTradeCount(trades.length);
        setConfirmedCount(trades.filter((t) => t.status === "CONFIRMED").length);
      })
      .catch(() => {});
  }, [userId]);

  return (
    <div className="space-y-gutter">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface">Agent Syndicate</h2>
          <p className="font-data-sm text-data-sm text-on-surface-variant mt-1">
            A2A coordination · CIO reasoning agent delegating to execution agents
          </p>
        </div>
        <Btn variant="ghost" icon="bolt" onClick={() => nav("dashboard")}>Run CIO Cycle</Btn>
      </div>

      {/* CIO hero */}
      <Panel glow className="p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-[0.06] pointer-events-none">
          <Icon name="neurology" className="text-[170px]" />
        </div>
        <div className="grid lg:grid-cols-12 gap-6 relative z-10">
          <div className="lg:col-span-7">
            <div className="flex items-start gap-4">
              <span className="w-12 h-12 rounded-lg bg-surface-container border border-amber/30 flex items-center justify-center shrink-0">
                <Icon name="neurology" className="text-amber text-[26px]" />
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="font-headline-md text-[22px] text-on-surface">{CIO.name}</h3>
                  <AgentStatus status="deciding" />
                </div>
                <p className="font-data-sm text-data-sm text-on-surface-variant mt-2 max-w-lg">{CIO.desc}</p>
                <div className="flex gap-2 mt-3 flex-wrap">
                  <Tag>{CIO.model}</Tag>
                  <Tag>{CIO.provider}</Tag>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5 grid grid-cols-3 gap-4 lg:border-l border-outline-variant/15 lg:pl-6">
            {[
              ["Intents emitted", tradeCount !== null ? tradeCount.toLocaleString() : "—"],
              ["Confirmed", confirmedCount.toLocaleString()],
              ["Sub-agents", "0"],
            ].map(([l, v]) => (
              <div key={l}>
                <Label className="mb-1.5">{l}</Label>
                <div className="font-data-lg text-[22px] text-on-surface tabular">{v}</div>
              </div>
            ))}
            <div className="col-span-3 flex gap-2 mt-1">
              <Btn variant="ghost" className="flex-1" icon="terminal" onClick={() => nav("dashboard")}>
                Live Log
              </Btn>
              <Btn variant="ghost" className="flex-1" icon="receipt_long" onClick={() => nav("activity")}>
                Activity
              </Btn>
            </div>
          </div>
        </div>
      </Panel>

      {/* A2A flow strip */}
      <Panel className="p-5">
        <Label className="mb-4">A2A Delegation Flow · ERC-7710</Label>
        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          {[
            { i: "person", t: "Owner EOA", s: "Master budget" },
            { i: "neurology", t: "CIO Agent", s: "Trade intent" },
            { i: "vpn_key", t: "Caveat Builder", s: "redelegate" },
            { i: "swap_horiz", t: "Swap Agent", s: "Burner key" },
            { i: "bolt", t: "1Shot Relayer", s: "Gas-abstracted" },
            { i: "check_circle", t: "Confirmed", s: "On-chain" },
          ].map((node, idx, arr) => (
            <div key={node.t} className="flex items-center gap-3">
              <div className="flex flex-col items-center text-center min-w-[88px]">
                <span className={
                  "w-10 h-10 rounded-lg flex items-center justify-center border " +
                  (idx === arr.length - 1
                    ? "bg-primary-container/10 border-primary-container/40 neon-glow"
                    : "bg-surface-container border-outline-variant/20")
                }>
                  <Icon
                    name={node.i}
                    className={idx === arr.length - 1 ? "text-primary-fixed-dim text-[20px]" : "text-on-surface-variant text-[20px]"}
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

      {/* Execution agents — empty state */}
      <div>
        <Label className="mb-3">Execution Agents · Sub-delegates</Label>
        <Panel className="p-10 flex flex-col items-center justify-center text-center">
          <Icon name="smart_toy" className="text-[44px] text-on-surface-variant/30 mb-3" />
          <p className="font-data-sm text-data-sm text-on-surface-variant">No execution agents deployed yet.</p>
          <p className="font-data-sm text-[12px] text-outline mt-1 max-w-sm">
            Run the CIO Agent from the Dashboard to generate a trade intent. Each intent provisions a burner-key swap agent via ERC-7710 redelegation.
          </p>
          <Btn variant="ghost" icon="play_arrow" className="mt-5" onClick={() => nav("dashboard")}>
            Go to Dashboard
          </Btn>
        </Panel>
      </div>

      {/* Caveats info */}
      <Panel className="p-6">
        <PanelHead title="CIO Agent Caveats" sub="Enforced at the delegation layer — not configurable at runtime" />
        <div className="mt-4 space-y-2">
          {CIO.caveats.map((c) => (
            <div key={c} className="flex items-center gap-3 font-data-sm text-data-sm text-on-surface-variant">
              <Icon name="check_circle" className="text-emerald text-[16px] shrink-0" />
              {c}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function PanelHead({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-2">
      <h3 className="font-headline-md text-headline-md text-on-surface">{title}</h3>
      {sub && <p className="font-data-sm text-data-sm text-on-surface-variant mt-1">{sub}</p>}
    </div>
  );
}
