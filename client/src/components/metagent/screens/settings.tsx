"use client";

import { useState } from "react";
import { Icon, Panel, PanelHead, Label, Tag, Btn, MonoAddr } from "../primitives";
import * as D from "@/lib/data";

export function Settings() {
  const [tab, setTab] = useState("ai");
  const [provider, setProvider] = useState("Venice AI");
  const [cioModel, setCioModel] = useState("Llama 3.3 70B");
  const [autoExec, setAutoExec] = useState(true);
  const [notif, setNotif] = useState({ confirmed: true, decisions: true, reverts: true, keys: false });

  const tabs = [
    ["ai", "AI Engine", "neurology"],
    ["relayer", "Relayer", "bolt"],
    ["network", "Network", "lan"],
    ["notifications", "Notifications", "notifications"],
  ];

  return (
    <div className="space-y-gutter max-w-[1100px]">
      <div>
        <h2 className="font-headline-md text-headline-md text-on-surface">Settings</h2>
        <p className="font-data-sm text-data-sm text-on-surface-variant mt-1">
          Configure the autonomous engine, relayer, and network
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-gutter">
        {/* Tab list */}
        <Panel className="lg:col-span-3 p-2 h-fit">
          {tabs.map(([k, l, ic]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={
                "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-left " +
                (tab === k
                  ? "bg-primary-container/10 text-primary-fixed-dim"
                  : "text-on-surface-variant hover:bg-surface-container-high/50 hover:text-on-surface")
              }
            >
              <Icon name={ic} className="text-[18px]" />
              <span className="font-label-caps text-label-caps">{l}</span>
            </button>
          ))}
        </Panel>

        <div className="lg:col-span-9 space-y-gutter">
          {tab === "ai" && (
            <Panel className="p-6 fade-up">
              <PanelHead
                title="AI Engine"
                sub="Provider for agent reasoning & execution"
                right={<Tag>OpenAI-compatible</Tag>}
              />
              <Label className="mb-2">Inference provider</Label>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  ["Venice AI", "Multi-model · Crypto RPC skill", "Active"],
                  ["OpenAI-compatible", "Any OpenAI-compatible endpoint", "Custom"],
                ].map(([n, s, badge]) => (
                  <button
                    key={n}
                    onClick={() => {
                      setProvider(n);
                      setCioModel("Llama 3.3 70B");
                    }}
                    className={
                      "p-4 rounded-lg border text-left transition-all " +
                      (provider === n
                        ? "border-primary-container/60 bg-primary-container/[0.07] neon-glow-soft"
                        : "border-outline-variant/30 hover:border-outline-variant/60")
                    }
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-data-lg text-data-lg text-on-surface">{n}</span>
                      {provider === n && (
                        <Icon name="check_circle" className="text-primary-fixed-dim text-[18px]" />
                      )}
                    </div>
                    <p className="font-data-sm text-[12px] text-on-surface-variant mt-1">{s}</p>
                    <Tag className="mt-3 inline-block">{badge}</Tag>
                  </button>
                ))}
              </div>

              <div className="grid sm:grid-cols-2 gap-5 mt-6">
                <div>
                  <Label className="mb-2">CIO reasoning model</Label>
                  <SelectField
                    value={cioModel}
                    onChange={setCioModel}
                    options={["Llama 3.3 70B", "Llama 3.1 8B", "Venice Opus", "Venice Large"]}
                  />
                </div>
                <div>
                  <Label className="mb-2">Execution model</Label>
                  <SelectField value="Kimi K2" onChange={() => {}} options={["Kimi K2", "Llama 3.3 70B"]} />
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-outline-variant/10 space-y-1">
                <Toggle
                  label="Autonomous execution"
                  sub="Agents act on intents without manual approval"
                  on={autoExec}
                  onClick={() => setAutoExec((v) => !v)}
                />
                <Toggle
                  label="Mock arbitrage feed"
                  sub="Use hardcoded opportunities to trigger the CIO cycle"
                  on={true}
                  onClick={() => {}}
                />
              </div>

              <div className="mt-6">
                <Label className="mb-2">API base URL</Label>
                <div className="font-data-sm text-data-sm text-on-surface-variant bg-surface-container-lowest/60 border border-outline-variant/20 rounded-lg px-4 py-3">
                  https://api.venice.ai/api/v1
                </div>
              </div>
            </Panel>
          )}

          {tab === "relayer" && (
            <Panel className="p-6 fade-up">
              <PanelHead
                title="Relayer · 1Shot"
                sub="Gas-abstracted execution (ERC-7710 / x402)"
                right={
                  <span className="inline-flex items-center gap-1.5 font-label-caps text-label-caps text-emerald">
                    <span className="w-1.5 h-1.5 circle bg-emerald" />
                    CONNECTED
                  </span>
                }
              />
              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
                {[
                  ["Fee collector", D.relayer.feeCollector],
                  ["Target address", D.relayer.targetAddress],
                  ["Min fee", D.relayer.minFee],
                  ["Avg gas price", D.relayer.gasPrice],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between border-b border-outline-variant/10 pb-3">
                    <span className="font-data-sm text-data-sm text-on-surface-variant">{k}</span>
                    {k.includes("address") || k.includes("collector") ? (
                      <MonoAddr>{v}</MonoAddr>
                    ) : (
                      <span className="font-data-sm text-data-sm text-on-surface">{v}</span>
                    )}
                  </div>
                ))}
              </div>
              <Label className="mt-6 mb-2">Supported settlement tokens</Label>
              <div className="flex gap-2 flex-wrap">
                {D.relayer.supported.map((s) => (
                  <Tag key={s}>
                    <span className="text-on-surface">{s}</span>
                  </Tag>
                ))}
              </div>
              <div className="mt-6 pt-5 border-t border-outline-variant/10">
                <Toggle
                  label="Status webhooks"
                  sub="Receive Confirmed / Reverted callbacks → real-time UI"
                  on={true}
                  onClick={() => {}}
                />
                <Toggle
                  label="Auto-refund on revert"
                  sub="Relayer refunds sponsored gas on failed caveat"
                  on={true}
                  onClick={() => {}}
                />
              </div>
            </Panel>
          )}

          {tab === "network" && (
            <Panel className="p-6 fade-up">
              <PanelHead title="Network" sub="Chain & RPC configuration" right={<Tag>MAINNET</Tag>} />
              <div className="space-y-3">
                {[
                  ["Base Mainnet", "Chain 8453 · USDC settlement", true],
                  ["Base Sepolia", "Chain 84532 · testnet", false],
                ].map(([n, s, on]) => (
                  <div
                    key={n as string}
                    className={
                      "flex items-center justify-between p-4 rounded-lg border " +
                      (on ? "border-primary-container/40 bg-primary-container/[0.05]" : "border-outline-variant/20")
                    }
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={
                          "w-9 h-9 rounded bg-surface-container flex items-center justify-center border " +
                          (on ? "border-primary-container/30" : "border-outline-variant/20")
                        }
                      >
                        <Icon
                          name="lan"
                          className={on ? "text-primary-fixed-dim text-[18px]" : "text-on-surface-variant text-[18px]"}
                        />
                      </span>
                      <div>
                        <div className="font-data-sm text-data-sm text-on-surface">{n as string}</div>
                        <div className="font-data-sm text-[12px] text-on-surface-variant">{s as string}</div>
                      </div>
                    </div>
                    {on ? (
                      <span className="font-label-caps text-label-caps text-primary-container">ACTIVE</span>
                    ) : (
                      <button className="font-label-caps text-label-caps text-on-surface-variant hover:text-on-surface">
                        SWITCH
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-5">
                <Label className="mb-2">RPC endpoint</Label>
                <div className="font-data-sm text-data-sm text-on-surface-variant bg-surface-container-lowest/60 border border-outline-variant/20 rounded-lg px-4 py-3">
                  https://mainnet.base.org
                </div>
              </div>
            </Panel>
          )}

          {tab === "notifications" && (
            <Panel className="p-6 fade-up">
              <PanelHead title="Notifications" sub="Alerts surfaced in the top bar" />
              <div className="space-y-1">
                <Toggle
                  label="Confirmed transactions"
                  sub="When the relayer settles a swap"
                  on={notif.confirmed}
                  onClick={() => setNotif((n) => ({ ...n, confirmed: !n.confirmed }))}
                />
                <Toggle
                  label="CIO Agent decisions"
                  sub="New trade intents generated"
                  on={notif.decisions}
                  onClick={() => setNotif((n) => ({ ...n, decisions: !n.decisions }))}
                />
                <Toggle
                  label="Reverted / failed tx"
                  sub="Caveat violations and reverts"
                  on={notif.reverts}
                  onClick={() => setNotif((n) => ({ ...n, reverts: !n.reverts }))}
                />
                <Toggle
                  label="Burner key lifecycle"
                  sub="Key reroll, expiry, revocation"
                  on={notif.keys}
                  onClick={() => setNotif((n) => ({ ...n, keys: !n.keys }))}
                />
              </div>
            </Panel>
          )}

          <Panel className="p-6 border border-error/20">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h4 className="font-data-lg text-data-lg text-error">Pause all agents</h4>
                <p className="font-data-sm text-data-sm text-on-surface-variant mt-1">
                  Halt autonomous execution and freeze all burner keys immediately.
                </p>
              </div>
              <Btn variant="danger" icon="pause">Emergency Stop</Btn>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Toggle({
  label,
  sub,
  on,
  onClick,
}: {
  label: string;
  sub?: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between py-3 text-left group">
      <div className="pr-4">
        <div className="font-data-sm text-data-sm text-on-surface">{label}</div>
        {sub && <div className="font-data-sm text-[12px] text-on-surface-variant mt-0.5">{sub}</div>}
      </div>
      <span
        className={
          "w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 " +
          (on ? "bg-primary-container" : "bg-surface-container-highest")
        }
      >
        <span
          className={
            "block w-5 h-5 rounded-full transition-transform " +
            (on ? "translate-x-5 bg-on-primary-container" : "bg-surface-container-lowest")
          }
        />
      </span>
    </button>
  );
}

function SelectField({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-surface-container-lowest/60 border border-outline-variant/30 rounded-lg px-4 py-3 font-data-sm text-data-sm text-on-surface focus:border-primary-container/60 pr-10"
      >
        {options.map((o) => (
          <option key={o} value={o} className="bg-surface-container">
            {o}
          </option>
        ))}
      </select>
      <Icon
        name="expand_more"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] pointer-events-none"
      />
    </div>
  );
}
