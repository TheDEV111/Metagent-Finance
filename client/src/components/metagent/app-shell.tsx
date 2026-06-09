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
import * as D from "@/lib/data";

type Route = "dashboard" | "portfolio" | "agents" | "permissions" | "activity" | "settings";
type TxItem = typeof D.activity[0];

const NAV: Array<[Route, string, string]> = [
  ["dashboard", "Dashboard", "dashboard"],
  ["portfolio", "Portfolio", "account_balance_wallet"],
  ["agents", "Agents", "smart_toy"],
  ["permissions", "Permissions", "key"],
  ["activity", "Activity", "receipt_long"],
  ["settings", "Settings", "settings"],
];

const TITLES: Record<Route, string> = {
  dashboard: "Dashboard",
  portfolio: "Portfolio",
  agents: "Agents",
  permissions: "Permissions",
  activity: "Activity",
  settings: "Settings",
};

export function MetagentApp() {
  const [connected, setConnected] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
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
        if (s.route) setRoute(s.route as Route);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("mg_state", JSON.stringify({ connected, userId, route }));
    } catch {}
  }, [connected, userId, route]);

  const nav = (r: Route | string) => {
    setRoute(r as Route);
    setMobileNav(false);
    window.scrollTo(0, 0);
  };

  if (!connected) {
    return <Onboarding onComplete={(uid) => { setUserId(uid); setConnected(true); }} />;
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
            onClick={() => { setConnected(false); localStorage.removeItem("mg_state"); }}
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
                badge
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
                {D.user.address}
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
            {route === "dashboard" && <Dashboard nav={nav} openTx={(t) => setTx(t)} userId={userId} />}
            {route === "portfolio" && <Portfolio nav={nav} />}
            {route === "agents" && <Agents nav={nav} openTx={(t) => setTx(t)} />}
            {route === "permissions" && <Permissions openGrant={() => setGrant(true)} />}
            {route === "activity" && <Activity openTx={(t) => setTx(t)} userId={userId} />}
            {route === "settings" && <Settings />}
          </div>
        </main>
      </div>

      <TxDrawer tx={tx} onClose={() => setTx(null)} />
      <GrantModal open={grant} onClose={() => setGrant(false)} />
    </div>
  );
}

const NOTIF_COLOR_MAP: Record<string, string> = {
  "primary-container": "text-primary-container",
  "amber": "text-amber",
  "secondary-fixed-dim": "text-secondary-fixed-dim",
  "error": "text-error",
};

function NotifDropdown({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="absolute right-0 top-12 w-80 glass-panel rounded-xl neon-glow-soft fade-up z-50 overflow-hidden"
      style={{ animationDuration: ".18s" }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-4 border-b border-outline-variant/15 flex items-center justify-between">
        <h4 className="font-data-lg text-data-lg text-on-surface">Notifications</h4>
        <span className="font-label-caps text-label-caps text-primary-container">4 NEW</span>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {D.notifications.map((n, i) => (
          <div
            key={i}
            className="flex gap-3 p-4 border-b border-outline-variant/10 hover:bg-surface-container-high/30 transition-colors"
          >
            <span
              className={
                "w-8 h-8 rounded bg-surface-container flex items-center justify-center border border-outline-variant/20 shrink-0 " +
                (NOTIF_COLOR_MAP[n.color] || "text-on-surface-variant")
              }
            >
              <Icon name={n.icon} className="text-[16px]" />
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-data-sm text-data-sm text-on-surface">{n.title}</div>
              <div className="font-data-sm text-[12px] text-on-surface-variant truncate">{n.text}</div>
            </div>
            <span className="font-data-sm text-[11px] text-outline shrink-0">{n.time}</span>
          </div>
        ))}
      </div>
      <button
        onClick={onClose}
        className="w-full p-3 font-label-caps text-label-caps text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/30 transition-colors"
      >
        MARK ALL READ
      </button>
    </div>
  );
}
