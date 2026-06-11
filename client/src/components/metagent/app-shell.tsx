"use client";

import { useState, useEffect } from "react";
import { Icon, IconBtn } from "./primitives";
import { Onboarding } from "./screens/onboarding";
import { Dashboard } from "./screens/dashboard";
import { Portfolio } from "./screens/portfolio";
import { Agents } from "./screens/agents";
import { Activity, TxDrawer } from "./screens/activity";
import { Permissions, GrantModal } from "./screens/permissions";
import { Settings } from "./screens/settings";
import { Demo } from "./screens/demo";
import * as D from "@/lib/data";

type Route = "dashboard" | "portfolio" | "agents" | "permissions" | "activity" | "settings" | "demo";
type TxItem = typeof D.activity[0];

const NAV: Array<[Route, string, string]> = [
  ["dashboard", "Dashboard", "dashboard"],
  ["portfolio", "Portfolio", "account_balance_wallet"],
  ["agents", "Agents", "smart_toy"],
  ["permissions", "Permissions", "key"],
  ["activity", "Activity", "receipt_long"],
  ["settings", "Settings", "settings"],
  ["demo", "Demo", "science"],
];

const TITLES: Record<Route, string> = {
  dashboard: "Dashboard",
  portfolio: "Portfolio",
  agents: "Agents",
  permissions: "Permissions",
  activity: "Activity",
  settings: "Settings",
  demo: "Demo",
};

export function MetagentApp() {
  const [connected, setConnected] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [route, setRoute] = useState<Route>("dashboard");
  const [tx, setTx] = useState<TxItem | null>(null);
  const [grant, setGrant] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("mg_state");
      const token = localStorage.getItem("mg_token");
      if (saved && token) {
        // Only restore connected state when a session token exists
        const s = JSON.parse(saved);
        if (s.connected) setConnected(true);
        if (s.userId) setUserId(s.userId);
        if (s.walletAddress) setWalletAddress(s.walletAddress);
        if (s.route) setRoute(s.route as Route);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("mg_state", JSON.stringify({ connected, userId, walletAddress, route }));
    } catch {}
  }, [connected, userId, route]);

  const nav = (r: Route | string) => {
    setRoute(r as Route);
    setMobileNav(false);
    window.scrollTo(0, 0);
  };

  if (!connected) {
    return <Onboarding onComplete={(uid, addr) => { setUserId(uid); setWalletAddress(addr); setConnected(true); }} />;
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <nav
        className={
          "fixed left-0 top-0 h-screen w-64 z-50 flex flex-col py-margin-desktop border-r border-outline-variant/10 backdrop-blur-xl bg-surface/80 transition-transform " +
          (mobileNav ? "translate-x-0" : "-translate-x-full md:translate-x-0")
        }
      >
        <div className="px-margin-desktop mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="hexagon" fill className="text-primary-fixed-dim text-[26px]" />
            <div>
              <div className="font-headline-md text-[20px] font-bold text-primary-fixed-dim tracking-tight leading-none">
                Metagent
              </div>
              <div className="font-data-sm text-[11px] text-on-surface-variant mt-1 tracking-wide">
                Autonomous Treasury
              </div>
            </div>
          </div>
          <button
            className="md:hidden text-on-surface-variant"
            onClick={() => setMobileNav(false)}
          >
            <Icon name="close" />
          </button>
        </div>

        <ul className="flex flex-col gap-1 px-3 flex-grow">
          {NAV.map(([key, label, ic]) => {
            const active = route === key;
            return (
              <li key={key}>
                <button
                  onClick={() => nav(key)}
                  className={
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-150 " +
                    (active
                      ? "text-primary bg-primary-container/10 border-r-2 border-primary font-bold"
                      : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50")
                  }
                >
                  <Icon name={ic} className={"text-[20px] " + (active ? "fill-icon" : "")} />
                  <span className="font-label-caps text-label-caps">{label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="px-margin-desktop mt-auto space-y-3">
          <div className="rounded-lg bg-surface-container-lowest/60 border border-outline-variant/15 p-3">
            <div className="flex items-center gap-1.5 font-label-caps text-label-caps text-emerald mb-1.5">
              <span className="w-1.5 h-1.5 circle bg-emerald pulse-dot" />
              SYSTEM ONLINE
            </div>
            <div className="font-data-sm text-[12px] text-on-surface-variant">2 agents · Base Mainnet</div>
          </div>
          <button
            onClick={() => { setConnected(false); setUserId(null); setWalletAddress(null); localStorage.removeItem("mg_state"); }}
            className="w-full bg-primary-container text-on-primary-container font-label-caps text-label-caps py-3 rounded font-bold flex justify-center items-center gap-2 hover:bg-primary-fixed transition-colors"
          >
            <Icon name="logout" className="text-[16px]" />
            Disconnect
          </button>
        </div>
      </nav>

      {/* Mobile overlay */}
      {mobileNav && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setMobileNav(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-40 backdrop-blur-md bg-background/70 border-b border-outline-variant/10 flex justify-between items-center px-margin-mobile md:px-margin-desktop h-20 gap-4">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden text-on-surface-variant"
              onClick={() => setMobileNav(true)}
            >
              <Icon name="menu" />
            </button>
            <div className="relative w-44 lg:w-72 hidden sm:block">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]" />
              <input
                className="w-full bg-surface-container-high border-none rounded-lg pl-10 pr-4 py-2.5 font-data-sm text-data-sm text-on-surface focus:ring-2 focus:ring-primary-container/60 placeholder:text-on-surface-variant"
                placeholder="Search resources…"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const q = (e.target as HTMLInputElement).value.toLowerCase();
                    if (q.includes("port")) nav("portfolio");
                    else if (q.includes("agent")) nav("agents");
                    else if (q.includes("perm")) nav("permissions");
                    else if (q.includes("activ") || q.includes("trade")) nav("activity");
                    else if (q.includes("setting")) nav("settings");
                    else if (q.includes("demo")) nav("demo");
                    else nav("dashboard");
                    (e.target as HTMLInputElement).value = "";
                  }
                }}
              />
            </div>
            <h1 className="sm:hidden font-headline-md text-[18px] text-on-surface">
              {TITLES[route]}
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden md:flex items-center gap-1.5 font-data-sm text-[12px] text-on-surface-variant bg-surface-container-high px-3 py-2 rounded-lg">
              <span className="w-1.5 h-1.5 circle bg-emerald" />
              Base
            </div>
            <IconBtn name="account_balance_wallet" onClick={() => nav("portfolio")} />
            <div className="relative">
              <IconBtn
                name="notifications"
                active={notifOpen}
                onClick={() => setNotifOpen((v) => !v)}
              />
              {notifOpen && (
                <NotifDropdown onClose={() => setNotifOpen(false)} />
              )}
            </div>
            <IconBtn name="monitor_heart" className="hidden sm:flex" onClick={() => nav("activity")} />
            <div className="hidden sm:block border-l border-outline-variant/30 h-8" />
            <div className="relative">
              <button
                onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false); }}
                className="flex items-center gap-2 hover:bg-surface-container-highest p-1 pr-1 sm:pr-3 rounded-full transition-colors"
              >
                <span className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-container/40 to-secondary-container/40 border border-primary/20 flex items-center justify-center">
                  <Icon name="person" className="text-primary-fixed-dim text-[18px]" />
                </span>
                <span className="font-data-sm text-data-sm text-on-surface hidden sm:block">
                  {walletAddress ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}` : "—"}
                </span>
              </button>
              {profileOpen && (
                <ProfileDropdown
                  walletAddress={walletAddress}
                  userId={userId}
                  onClose={() => setProfileOpen(false)}
                  onSettings={() => { setProfileOpen(false); nav("settings"); }}
                  onDisconnect={() => {
                    setConnected(false);
                    setUserId(null);
                    setWalletAddress(null);
                    localStorage.removeItem("mg_state");
                    setProfileOpen(false);
                  }}
                />
              )}
            </div>
          </div>
        </header>

        {/* Canvas */}
        <main
          className="flex-1 px-margin-mobile md:px-margin-desktop py-margin-desktop w-full max-w-container-max mx-auto"
          onClick={() => notifOpen && setNotifOpen(false)}
        >
          <div key={route} className="fade-up">
            {route === "dashboard" && <Dashboard nav={nav} openTx={(t) => setTx(t)} userId={userId} walletAddress={walletAddress} />}
            {route === "portfolio" && <Portfolio nav={nav} walletAddress={walletAddress} />}
            {route === "agents" && <Agents nav={nav} userId={userId} />}
            {route === "permissions" && <Permissions openGrant={() => setGrant(true)} userId={userId} />}
            {route === "activity" && <Activity openTx={(t) => setTx(t)} userId={userId} />}
            {route === "settings" && <Settings walletAddress={walletAddress} userId={userId} />}
            {route === "demo" && <Demo />}
          </div>
        </main>
      </div>

      <TxDrawer tx={tx} onClose={() => setTx(null)} />
      <GrantModal open={grant} onClose={() => setGrant(false)} />
    </div>
  );
}

function ProfileDropdown({
  walletAddress,
  userId,
  onClose,
  onSettings,
  onDisconnect,
}: {
  walletAddress: string | null;
  userId: string | null;
  onClose: () => void;
  onSettings: () => void;
  onDisconnect: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userId) return;
    import("@/lib/api").then(({ fetchUser }) =>
      fetchUser(userId).then((u) => {
        if (u.treasuryName) setName(u.treasuryName);
        if (u.email) { setEmail(u.email); setEmailVerified(u.emailVerified); }
      }).catch(() => {})
    );
  }, [userId]);

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const { updateUserProfile } = await import("@/lib/api");
      await updateUserProfile(userId, { treasuryName: name, email });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="absolute right-0 top-12 w-80 glass-panel rounded-xl neon-glow-soft fade-up z-50 overflow-hidden"
      style={{ animationDuration: ".18s" }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="p-4 border-b border-outline-variant/15 flex items-center gap-3">
        <span className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-container/40 to-secondary-container/40 border border-primary/20 flex items-center justify-center shrink-0">
          <Icon name="person" className="text-primary-fixed-dim text-[20px]" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-data-sm text-data-sm text-on-surface truncate">
            {name || "Metagent Treasury"}
          </div>
          <div className="font-data-sm text-[11px] text-on-surface-variant truncate">
            {walletAddress ? `${walletAddress.slice(0, 10)}…${walletAddress.slice(-6)}` : "—"}
          </div>
        </div>
        <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
          <Icon name="close" className="text-[18px]" />
        </button>
      </div>

      {/* Editable fields */}
      <div className="p-4 space-y-3">
        <div>
          <label className="font-label-caps text-[11px] text-on-surface-variant tracking-widest block mb-1.5">
            TREASURY NAME
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Metagent Treasury"
            className="w-full bg-surface-container-lowest/60 border border-outline-variant/30 rounded-lg px-3 py-2.5 font-data-sm text-data-sm text-on-surface focus:border-primary-container/60 focus:ring-0 placeholder:text-on-surface-variant/50"
          />
        </div>
        <div>
          <label className="font-label-caps text-[11px] text-on-surface-variant tracking-widest block mb-1.5">
            NOTIFICATION EMAIL
          </label>
          <div className="flex items-center gap-2 bg-surface-container-lowest/60 border border-outline-variant/30 rounded-lg px-3 py-2.5 focus-within:border-primary-container/60 transition-colors">
            <Icon name="mail" className="text-on-surface-variant text-[16px] shrink-0" />
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailVerified(false); }}
              placeholder="you@example.com"
              className="flex-1 bg-transparent border-none font-data-sm text-data-sm text-on-surface focus:ring-0 placeholder:text-on-surface-variant/50 p-0 min-w-0"
            />
            {emailVerified && <Icon name="verified" className="text-emerald text-[15px] shrink-0" />}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2.5 rounded-lg bg-primary-container/10 border border-primary-container/30 font-label-caps text-label-caps text-primary-container hover:bg-primary-container/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Icon name="save" className="text-[15px]" />
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save Changes"}
        </button>
      </div>

      {/* Footer actions */}
      <div className="border-t border-outline-variant/10 divide-y divide-outline-variant/10">
        <button
          onClick={onSettings}
          className="w-full flex items-center gap-3 px-4 py-3 font-data-sm text-data-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/30 transition-colors"
        >
          <Icon name="settings" className="text-[16px]" />
          Account Settings
        </button>
        <button
          onClick={onDisconnect}
          className="w-full flex items-center gap-3 px-4 py-3 font-data-sm text-data-sm text-error hover:bg-error/5 transition-colors"
        >
          <Icon name="logout" className="text-[16px]" />
          Disconnect Wallet
        </button>
      </div>
    </div>
  );
}

function NotifDropdown({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="absolute right-0 top-12 w-80 glass-panel rounded-xl neon-glow-soft fade-up z-50 overflow-hidden"
      style={{ animationDuration: ".18s" }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-4 border-b border-outline-variant/15 flex items-center justify-between">
        <h4 className="font-data-lg text-data-lg text-on-surface">Notifications</h4>
        <span className="font-label-caps text-label-caps text-on-surface-variant">0 NEW</span>
      </div>
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <Icon name="notifications_none" className="text-[32px] text-on-surface-variant/30 mb-2" />
        <p className="font-data-sm text-[12px] text-outline">No notifications yet.</p>
        <p className="font-data-sm text-[11px] text-outline mt-1">Agent confirmations and decisions will appear here.</p>
      </div>
      <button
        onClick={onClose}
        className="w-full p-3 font-label-caps text-label-caps text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/30 transition-colors border-t border-outline-variant/10"
      >
        CLOSE
      </button>
    </div>
  );
}
