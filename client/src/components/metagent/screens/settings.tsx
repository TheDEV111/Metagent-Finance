"use client";

import { useState, useEffect } from "react";
import { useConnection } from "wagmi";
import { Icon, Panel, PanelHead, Label, Tag, Btn, MonoAddr } from "../primitives";
import { fetchUser, updateUserProfile, type NotifPrefs } from "@/lib/api";

export function Settings({ walletAddress, userId }: { walletAddress: string | null; userId: string | null }) {
  const { address } = useConnection();
  const [tab, setTab] = useState("account");

  // Account
  const [treasuryName, setTreasuryName] = useState("");
  const [email, setEmail] = useState("");
  const [emailSaved, setEmailSaved] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [saving, setSaving] = useState(false);

  // AI
  const [cioModel, setCioModel] = useState("Llama 3.3 70B");
  const [swapModel, setSwapModel] = useState("Mistral Small 24B");
  const [autoExec, setAutoExec] = useState(true);

  // Notifications
  const [notif, setNotif] = useState<NotifPrefs>({ confirmed: true, decisions: true, reverts: true, keys: false });

  // Emergency stop
  const [stopped, setStopped] = useState(false);

  // Load from DB on mount
  useEffect(() => {
    if (!userId) return;
    fetchUser(userId).then((user) => {
      if (user.treasuryName) setTreasuryName(user.treasuryName);
      if (user.email) { setEmail(user.email); setEmailVerified(user.emailVerified); }
      if (user.notifPrefs) setNotif(user.notifPrefs);
    }).catch(() => {});
  }, [userId]);

  const handleSaveAccount = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      await updateUserProfile(userId, { treasuryName, email });
      setEmailSaved(true);
      setTimeout(() => setEmailSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!userId || !email.includes("@")) return;
    await updateUserProfile(userId, { email, emailVerified: true });
    setEmailVerified(true);
  };

  const handleNotifToggle = async (key: keyof NotifPrefs) => {
    const next = { ...notif, [key]: !notif[key] };
    setNotif(next);
    if (userId) updateUserProfile(userId, { notifPrefs: next }).catch(() => {});
  };

  const handleEmergencyStop = () => setStopped(true);
  const handleResume = () => setStopped(false);

  const tabs: [string, string, string][] = [
    ["account",       "Account",       "person"],
    ["ai",            "AI Engine",     "neurology"],
    ["relayer",       "Relayer",       "bolt"],
    ["network",       "Network",       "lan"],
    ["notifications", "Notifications", "notifications"],
  ];

  return (
    <div className="space-y-gutter max-w-[1100px]">
      <div>
        <h2 className="font-headline-md text-headline-md text-on-surface">Settings</h2>
        <p className="font-data-sm text-data-sm text-on-surface-variant mt-1">
          Configure the autonomous engine, relayer, and account
        </p>
      </div>

      {stopped && (
        <div className="flex items-center justify-between gap-3 bg-error/10 border border-error/30 rounded-xl px-5 py-4">
          <div className="flex items-center gap-3">
            <Icon name="pause_circle" className="text-error text-[22px]" />
            <div>
              <div className="font-data-sm text-data-sm text-error">All agents paused</div>
              <div className="font-data-sm text-[12px] text-on-surface-variant mt-0.5">
                Autonomous execution is suspended. No new trade intents will be generated.
              </div>
            </div>
          </div>
          <Btn icon="play_arrow" onClick={handleResume}>Resume Agents</Btn>
        </div>
      )}

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

          {/* ── ACCOUNT ── */}
          {tab === "account" && (
            <Panel className="p-6 fade-up">
              <PanelHead title="Account" sub="Treasury identity and notification preferences" />

              <div className="space-y-5 mt-2">
                {/* Connected wallet */}
                <div>
                  <Label className="mb-2">Connected wallet</Label>
                  <div className="flex items-center gap-3 bg-surface-container-lowest/60 border border-outline-variant/20 rounded-lg px-4 py-3">
                    <Icon name="account_balance_wallet" className="text-primary-fixed-dim text-[18px]" />
                    <MonoAddr className="flex-1 text-on-surface">
                      {address ?? walletAddress ?? "—"}
                    </MonoAddr>
                    <Tag>BASE</Tag>
                  </div>
                </div>

                {/* Treasury name */}
                <div>
                  <Label className="mb-2">Treasury name</Label>
                  <input
                    type="text"
                    value={treasuryName}
                    onChange={(e) => setTreasuryName(e.target.value)}
                    placeholder="My Metagent Treasury"
                    className="w-full bg-surface-container-lowest/60 border border-outline-variant/30 rounded-lg px-4 py-3 font-data-sm text-data-sm text-on-surface focus:border-primary-container/60 focus:ring-0 placeholder:text-on-surface-variant/50"
                  />
                </div>

                {/* Email */}
                <div>
                  <Label className="mb-2">Notification email</Label>
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center gap-2 bg-surface-container-lowest/60 border border-outline-variant/30 rounded-lg px-4 py-3 focus-within:border-primary-container/60 transition-colors">
                      <Icon name="mail" className="text-on-surface-variant text-[17px] shrink-0" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setEmailVerified(false); }}
                        placeholder="you@example.com"
                        className="flex-1 bg-transparent border-none font-data-sm text-data-sm text-on-surface focus:ring-0 placeholder:text-on-surface-variant/50 p-0"
                      />
                      {emailVerified && (
                        <Icon name="verified" className="text-emerald text-[17px] shrink-0" />
                      )}
                    </div>
                    <Btn
                      variant="ghost"
                      icon="send"
                      onClick={handleVerifyEmail}
                    >
                      Verify
                    </Btn>
                  </div>
                  <p className="font-data-sm text-[12px] text-on-surface-variant mt-1.5">
                    Receive alerts for confirmed trades, reverts, and agent decisions.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2 border-t border-outline-variant/10">
                  <Btn icon="save" onClick={handleSaveAccount} disabled={saving}>
                    {saving ? "Saving…" : "Save Changes"}
                  </Btn>
                  {emailSaved && (
                    <span className="font-data-sm text-[13px] text-emerald flex items-center gap-1.5 fade-up">
                      <Icon name="check_circle" className="text-[15px]" /> Saved
                    </span>
                  )}
                </div>
              </div>
            </Panel>
          )}

          {/* ── AI ENGINE ── */}
          {tab === "ai" && (
            <Panel className="p-6 fade-up">
              <PanelHead
                title="AI Engine"
                sub="Provider and models for agent reasoning & execution"
                right={<Tag>OpenAI-compatible</Tag>}
              />

              <Label className="mb-2">Inference provider</Label>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  ["Venice AI", "Multi-model · Crypto RPC skill", "ACTIVE"],
                  ["OpenAI-compatible", "Any OpenAI-compatible endpoint", "CUSTOM"],
                ].map(([n, s, badge]) => (
                  <div
                    key={n}
                    className={
                      "p-4 rounded-lg border text-left " +
                      (n === "Venice AI"
                        ? "border-primary-container/60 bg-primary-container/[0.07] neon-glow-soft"
                        : "border-outline-variant/30 opacity-50")
                    }
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-data-lg text-data-lg text-on-surface">{n}</span>
                      {n === "Venice AI" && <Icon name="check_circle" className="text-primary-fixed-dim text-[18px]" />}
                    </div>
                    <p className="font-data-sm text-[12px] text-on-surface-variant mt-1">{s}</p>
                    <Tag className="mt-3 inline-block">{badge}</Tag>
                  </div>
                ))}
              </div>

              <div className="grid sm:grid-cols-2 gap-5 mt-6">
                <div>
                  <Label className="mb-2">CIO reasoning model</Label>
                  <SelectField
                    value={cioModel}
                    onChange={setCioModel}
                    options={["Llama 3.3 70B", "Llama 3.1 405B", "DeepSeek R1 70B"]}
                  />
                  <p className="font-data-sm text-[12px] text-on-surface-variant mt-1.5">
                    Active: <span className="text-primary-container">llama-3.3-70b</span>
                  </p>
                </div>
                <div>
                  <Label className="mb-2">Swap execution model</Label>
                  <SelectField
                    value={swapModel}
                    onChange={setSwapModel}
                    options={["Mistral Small 24B", "Llama 3.3 70B", "Nous Hermes 24B"]}
                  />
                  <p className="font-data-sm text-[12px] text-on-surface-variant mt-1.5">
                    Active: <span className="text-primary-container">mistral-small-3-2-24b-instruct</span>
                  </p>
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

          {/* ── RELAYER ── */}
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
                  ["Provider",        "1Shot Relayer"],
                  ["Standard",        "ERC-7710 / EIP-7715"],
                  ["Min fee",         "$0.18"],
                  ["Gas abstraction", "x402 protocol"],
                  ["Chain",           "Base Mainnet (8453)"],
                  ["Fee token",       "USDC"],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between border-b border-outline-variant/10 pb-3">
                    <span className="font-data-sm text-data-sm text-on-surface-variant">{k}</span>
                    <span className="font-data-sm text-data-sm text-on-surface">{v}</span>
                  </div>
                ))}
              </div>
              <Label className="mt-6 mb-2">Supported settlement tokens</Label>
              <div className="flex gap-2 flex-wrap">
                {["USDC", "WETH", "crvUSD"].map((s) => (
                  <Tag key={s}><span className="text-on-surface">{s}</span></Tag>
                ))}
              </div>
              <div className="mt-6 pt-5 border-t border-outline-variant/10">
                <Toggle label="Status webhooks" sub="Receive Confirmed / Reverted callbacks → real-time UI" on={true} onClick={() => {}} />
                <Toggle label="Auto-refund on revert" sub="Relayer refunds sponsored gas on failed caveat" on={true} onClick={() => {}} />
              </div>
            </Panel>
          )}

          {/* ── NETWORK ── */}
          {tab === "network" && (
            <Panel className="p-6 fade-up">
              <PanelHead title="Network" sub="Chain & RPC configuration" right={<Tag>MAINNET</Tag>} />
              <div className="space-y-3">
                {[
                  ["Base Mainnet", "Chain 8453 · USDC settlement", true],
                  ["Base Sepolia",  "Chain 84532 · testnet (1Shot unsupported)", false],
                ].map(([n, s, on]) => (
                  <div
                    key={n as string}
                    className={
                      "flex items-center justify-between p-4 rounded-lg border " +
                      (on ? "border-primary-container/40 bg-primary-container/[0.05]" : "border-outline-variant/20 opacity-60")
                    }
                  >
                    <div className="flex items-center gap-3">
                      <span className={"w-9 h-9 rounded bg-surface-container flex items-center justify-center border " + (on ? "border-primary-container/30" : "border-outline-variant/20")}>
                        <Icon name="lan" className={(on ? "text-primary-fixed-dim" : "text-on-surface-variant") + " text-[18px]"} />
                      </span>
                      <div>
                        <div className="font-data-sm text-data-sm text-on-surface">{n as string}</div>
                        <div className="font-data-sm text-[12px] text-on-surface-variant">{s as string}</div>
                      </div>
                    </div>
                    {on
                      ? <span className="font-label-caps text-label-caps text-primary-container">ACTIVE</span>
                      : <span className="font-label-caps text-label-caps text-on-surface-variant/50">UNAVAILABLE</span>
                    }
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

          {/* ── NOTIFICATIONS ── */}
          {tab === "notifications" && (
            <Panel className="p-6 fade-up">
              <PanelHead title="Notifications" sub="Alerts surfaced in the top bar and email" />
              <div className="space-y-1">
                {([
                  ["confirmed", "Confirmed transactions",   "When the relayer settles a swap"],
                  ["decisions", "CIO Agent decisions",      "New trade intents generated"],
                  ["reverts",   "Reverted / failed tx",     "Caveat violations and reverts"],
                  ["keys",      "Burner key lifecycle",     "Key reroll, expiry, revocation"],
                ] as [keyof typeof notif, string, string][]).map(([k, l, s]) => (
                  <Toggle
                    key={k}
                    label={l}
                    sub={s}
                    on={notif[k]}
                    onClick={() => handleNotifToggle(k)}
                  />
                ))}
              </div>
              <p className="font-data-sm text-[12px] text-on-surface-variant mt-4 flex items-center gap-1.5">
                <Icon name="info" className="text-[14px]" />
                Add an email on the Account tab to receive these as email alerts.
              </p>
            </Panel>
          )}

          {/* ── EMERGENCY STOP ── */}
          <Panel className="p-6 border border-error/20">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h4 className="font-data-lg text-data-lg text-error">
                  {stopped ? "Agents paused" : "Pause all agents"}
                </h4>
                <p className="font-data-sm text-data-sm text-on-surface-variant mt-1">
                  {stopped
                    ? "Autonomous execution is suspended. Click Resume to restart the agent cycle."
                    : "Halt autonomous execution and freeze all burner keys immediately."}
                </p>
              </div>
              {stopped
                ? <Btn icon="play_arrow" onClick={handleResume}>Resume Agents</Btn>
                : <Btn variant="danger" icon="pause" onClick={handleEmergencyStop}>Emergency Stop</Btn>
              }
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Toggle({ label, sub, on, onClick }: { label: string; sub?: string; on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between py-3 text-left group">
      <div className="pr-4">
        <div className="font-data-sm text-data-sm text-on-surface">{label}</div>
        {sub && <div className="font-data-sm text-[12px] text-on-surface-variant mt-0.5">{sub}</div>}
      </div>
      <span className={"w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 " + (on ? "bg-primary-container" : "bg-surface-container-highest")}>
        <span className={"block w-5 h-5 rounded-full transition-transform " + (on ? "translate-x-5 bg-on-primary-container" : "bg-surface-container-lowest")} />
      </span>
    </button>
  );
}

function SelectField({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-surface-container-lowest/60 border border-outline-variant/30 rounded-lg px-4 py-3 font-data-sm text-data-sm text-on-surface focus:border-primary-container/60 pr-10"
      >
        {options.map((o) => <option key={o} value={o} className="bg-surface-container">{o}</option>)}
      </select>
      <Icon name="expand_more" className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] pointer-events-none" />
    </div>
  );
}
