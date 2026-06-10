"use client";

import { useState, useEffect } from "react";
import { Icon, IconBtn, Tag } from "./primitives";
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
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("mg_state");
      if (saved) {
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
            <div className="font-data-sm text-[12px] text-on-surface-variant">5 agents · Base Mainnet</div>
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
            <IconBtn name="account_balance_wallet" />
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
            <IconBtn name="monitor_heart" className="hidden sm:flex" />
            <div className="hidden sm:block border-l border-outline-variant/30 h-8" />
            <button className="flex items-center gap-2 hover:bg-surface-container-highest p-1 pr-1 sm:pr-3 rounded-full transition-colors">
              <span className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-container/40 to-secondary-container/40 border border-primary/20 flex items-center justify-center">
                <Icon name="person" className="text-primary-fixed-dim text-[18px]" />
              </span>
              <span className="font-data-sm text-data-sm text-on-surface hidden sm:block">
                {walletAddress ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}` : "—"}
              </span>
            </button>
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
            {route === "permissions" && <Permissions openGrant={() => setGrant(true)} />}
            {route === "activity" && <Activity openTx={(t) => setTx(t)} userId={userId} />}
            {route === "settings" && <Settings />}
            {route === "demo" && <Demo />}
          </div>
        </main>
      </div>

      <TxDrawer tx={tx} onClose={() => setTx(null)} />
      <GrantModal open={grant} onClose={() => setGrant(false)} />
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
