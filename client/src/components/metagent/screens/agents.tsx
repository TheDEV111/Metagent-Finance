"use client";

import { useState } from "react";
import { Icon, Panel, Label, Tag, Btn, AgentStatus, MonoAddr, IconBtn, RouteCell, TxStatus } from "../primitives";
import * as D from "@/lib/data";

type Agent = typeof D.agents[0];

export function Agents({ nav, openTx }: { nav: (r: string) => void; openTx: (tx: typeof D.activity[0]) => void }) {
  const [sel, setSel] = useState<Agent | null>(null);
  const cio = D.agents.find((a) => a.id === "cio")!;
  const execs = D.agents.filter((a) => a.id !== "cio");

  return (
    <div className="space-y-gutter">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface">Agent Syndicate</h2>
          <p className="font-data-sm text-data-sm text-on-surface-variant mt-1">
            A2A coordination · 1 reasoning agent delegating to 4 execution agents
          </p>
        </div>
        <div className="flex gap-2">
          <Btn variant="ghost" icon="bolt">Run CIO Cycle</Btn>
          <Btn icon="add">Deploy Agent</Btn>
        </div>
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
                  <h3 className="font-headline-md text-[22px] text-on-surface">{cio.name}</h3>
                  <AgentStatus status={cio.status} />
                </div>
                <p className="font-data-sm text-data-sm text-on-surface-variant mt-2 max-w-lg">{cio.desc}</p>
                <div className="flex gap-2 mt-3 flex-wrap">
                  <Tag>{cio.model}</Tag>
                  <Tag>{cio.provider}</Tag>
                  <Tag>{cio.address}</Tag>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5 grid grid-cols-3 gap-4 lg:border-l border-outline-variant/15 lg:pl-6">
            {[
              ["Intents emitted", cio.executed.toLocaleString()],
              ["Success", cio.success + "%"],
              ["Sub-agents", "4"],
            ].map(([l, v]) => (
              <div key={l}>
                <Label className="mb-1.5">{l}</Label>
                <div className="font-data-lg text-[22px] text-on-surface tabular">{v}</div>
              </div>
            ))}
            <div className="col-span-3 flex gap-2 mt-1">
              <Btn variant="ghost" className="flex-1" icon="visibility" onClick={() => setSel(cio)}>
                Inspect
              </Btn>
              <Btn variant="dim" className="flex-1" icon="terminal" onClick={() => nav("dashboard")}>
                Live Log
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
                <span
                  className={
                    "w-10 h-10 rounded-lg flex items-center justify-center border " +
                    (idx === arr.length - 1
                      ? "bg-primary-container/10 border-primary-container/40 neon-glow"
                      : "bg-surface-container border-outline-variant/20")
                  }
                >
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

      {/* Execution agents grid */}
      <div>
        <Label className="mb-3">Execution Agents · Sub-delegates</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
          {execs.map((a) => (
            <Panel
              key={a.id}
              className="p-5 hover:border-primary-container/30 transition-colors cursor-pointer group"
              onClick={() => setSel(a)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-lg bg-surface-container border border-outline-variant/20 flex items-center justify-center">
                    <Icon name={a.icon} className="text-secondary-fixed-dim text-[22px]" />
                  </span>
                  <div>
                    <h4 className="font-data-lg text-data-lg text-on-surface group-hover:text-primary-fixed-dim transition-colors">
                      {a.name}
                    </h4>
                    <p className="font-data-sm text-[12px] text-on-surface-variant">
                      {a.model} · {a.provider}
                    </p>
                  </div>
                </div>
                <AgentStatus status={a.status} />
              </div>
              <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-outline-variant/10">
                {[
                  ["Burner key", a.address],
                  ["Limit", a.limit || "—"],
                  ["Success", a.success + "%"],
                ].map(([l, v]) => (
                  <div key={l}>
                    <Label className="mb-1 normal-case">{l}</Label>
                    <div className="font-data-sm text-data-sm text-on-surface truncate">{v}</div>
                  </div>
                ))}
              </div>
            </Panel>
          ))}
        </div>
      </div>

      <AgentDrawer agent={sel} onClose={() => setSel(null)} openTx={openTx} />
    </div>
  );
}

function AgentDrawer({
  agent,
  onClose,
  openTx,
}: {
  agent: Agent | null;
  onClose: () => void;
  openTx: (tx: typeof D.activity[0]) => void;
}) {
  if (!agent) return null;
  const isExec = agent.id !== "cio";
  const txs = D.activity.filter((a) => a.agent === agent.name).slice(0, 4);

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
            <span
              className={
                "w-10 h-10 rounded-lg bg-surface-container border flex items-center justify-center " +
                (isExec ? "border-outline-variant/20" : "border-amber/30")
              }
            >
              <Icon
                name={agent.icon}
                className={isExec ? "text-secondary-fixed-dim text-[20px]" : "text-amber text-[20px]"}
              />
            </span>
            <div>
              <h3 className="font-data-lg text-data-lg text-on-surface">{agent.name}</h3>
              <p className="font-data-sm text-[12px] text-on-surface-variant">{agent.role}</p>
            </div>
          </div>
          <IconBtn name="close" onClick={onClose} />
        </div>

        <div className="p-5 space-y-6">
          <div className="flex items-center gap-2 flex-wrap">
            <AgentStatus status={agent.status} />
            <Tag>{agent.model}</Tag>
            <Tag>{agent.provider}</Tag>
          </div>
          <p className="font-data-sm text-data-sm text-on-surface-variant leading-relaxed">{agent.desc}</p>

          <div className="grid grid-cols-3 gap-3">
            {[
              ["Executions", agent.executed.toLocaleString()],
              ["Success", agent.success + "%"],
              [isExec ? "Limit" : "Sub-agents", isExec ? (agent.limit || "—") : "4"],
            ].map(([l, v]) => (
              <div key={l} className="bg-surface-container-lowest/60 border border-outline-variant/15 rounded-lg p-3">
                <Label className="mb-1.5 normal-case">{l}</Label>
                <div className="font-data-sm text-data-sm text-on-surface">{v}</div>
              </div>
            ))}
          </div>

          <div>
            <Label className="mb-3">Cryptographic Caveats</Label>
            <div className="space-y-2">
              {agent.caveats.map((c, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 bg-surface-container-lowest/60 border border-outline-variant/15 rounded-lg p-3"
                >
                  <Icon name="shield_lock" className="text-primary-fixed-dim text-[16px] mt-0.5 shrink-0" />
                  <span className="font-data-sm text-data-sm text-on-surface-variant">{c}</span>
                </div>
              ))}
            </div>
          </div>

          {isExec && agent.address && (
            <div>
              <Label className="mb-2">Burner Key</Label>
              <div className="bg-surface-container-lowest/60 border border-outline-variant/15 rounded-lg p-3 flex items-center justify-between">
                <MonoAddr>{agent.address}</MonoAddr>
                <span className="font-label-caps text-label-caps text-emerald">ACTIVE</span>
              </div>
            </div>
          )}

          {txs.length > 0 && (
            <div>
              <Label className="mb-3">Recent Executions</Label>
              <div className="space-y-1">
                {txs.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => { onClose(); openTx(a); }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-surface-container-high/40 transition-colors"
                  >
                    <RouteCell from={a.from} to={a.to} />
                    <div className="flex items-center gap-3">
                      <span className="font-data-sm text-[12px] text-on-surface-variant tabular">
                        {D.fmtUSD(a.amount)}
                      </span>
                      <TxStatus status={a.status} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Btn variant="ghost" className="flex-1" icon="tune">Configure</Btn>
            {isExec && <Btn variant="danger" icon="block">Revoke Key</Btn>}
          </div>
        </div>
      </div>
    </div>
  );
}
