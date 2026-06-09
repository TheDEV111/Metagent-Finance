"use client";

import { useState } from "react";

/* ---------- Icon ---------- */
export function Icon({
  name,
  className = "",
  fill = false,
  style,
}: {
  name: string;
  className?: string;
  fill?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={"material-symbols-outlined " + (fill ? "fill-icon " : "") + className}
      style={style}
    >
      {name}
    </span>
  );
}

/* ---------- Panel ---------- */
export function Panel({
  className = "",
  children,
  glow = false,
  onClick,
}: {
  className?: string;
  children: React.ReactNode;
  glow?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className={"glass-panel rounded-xl " + (glow ? "neon-glow-soft " : "") + className}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

/* ---------- PanelHead ---------- */
export function PanelHead({
  title,
  sub,
  right,
  icon,
  live = false,
}: {
  title: string;
  sub?: string;
  right?: React.ReactNode;
  icon?: string;
  live?: boolean;
}) {
  return (
    <div className="flex justify-between items-start gap-4 mb-5">
      <div className="min-w-0">
        <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
          {icon && <Icon name={icon} className="text-primary-fixed-dim text-[20px]" />}
          <span className="truncate">{title}</span>
          {live && <LivePill />}
        </h3>
        {sub && <p className="font-data-sm text-data-sm text-on-surface-variant mt-1">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

/* ---------- LivePill ---------- */
export function LivePill() {
  return (
    <span className="flex items-center gap-1.5 bg-surface-container px-2 py-1 rounded text-[11px] font-data-sm text-primary-container border border-primary-container/20 tracking-wider">
      <span className="w-1.5 h-1.5 bg-primary-container circle pulse-dot" /> LIVE
    </span>
  );
}

/* ---------- Tag ---------- */
export function Tag({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={"font-data-sm text-[12px] text-on-surface-variant border border-outline-variant/30 px-2 py-1 rounded bg-surface-container whitespace-nowrap " + className}>
      {children}
    </span>
  );
}

/* ---------- Label ---------- */
export function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={"font-label-caps text-label-caps text-on-surface-variant uppercase " + className}>
      {children}
    </p>
  );
}

/* ---------- Btn ---------- */
type BtnVariant = "primary" | "ghost" | "dim" | "danger";

export function Btn({
  children,
  variant = "primary",
  icon,
  iconEnd,
  className = "",
  onClick,
  disabled,
}: {
  children?: React.ReactNode;
  variant?: BtnVariant;
  icon?: string;
  iconEnd?: string;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const base = "font-label-caps text-label-caps inline-flex items-center justify-center gap-2 transition-all duration-150 rounded select-none";
  const map: Record<BtnVariant, string> = {
    primary: "bg-primary-container text-on-primary-container hover:bg-primary-fixed px-4 py-3 font-bold",
    ghost: "border border-outline-variant/40 text-on-surface hover:bg-surface-container-high hover:border-outline-variant/70 px-4 py-3",
    dim: "bg-surface-container-high text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest px-4 py-3",
    danger: "border border-error/40 text-error hover:bg-error/10 px-4 py-3",
  };
  return (
    <button
      className={base + " " + map[variant] + " " + className}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <Icon name={icon} className="text-[16px]" />}
      {children}
      {iconEnd && <Icon name={iconEnd} className="text-[16px]" />}
    </button>
  );
}

/* ---------- IconBtn ---------- */
export function IconBtn({
  name,
  className = "",
  active = false,
  badge = false,
  onClick,
}: {
  name: string;
  className?: string;
  active?: boolean;
  badge?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      className={
        "relative p-2 rounded transition-colors " +
        (active
          ? "text-primary-fixed-dim bg-primary-container/10 "
          : "text-on-surface-variant hover:text-primary-fixed-dim hover:bg-surface-container-high ") +
        className
      }
      onClick={onClick}
    >
      {badge && <span className="absolute top-1 right-1 w-2 h-2 bg-primary-container circle pulse-dot" />}
      <Icon name={name} className="text-[20px]" />
    </button>
  );
}

/* ---------- TxStatus ---------- */
const TX_STATUS = {
  estimating: { label: "Estimating", color: "text-on-surface-variant", dot: "border border-outline" },
  signed: { label: "Signed", color: "text-secondary-fixed-dim", dot: "bg-secondary-fixed-dim" },
  confirmed: { label: "Confirmed", color: "text-primary-container", dot: "bg-primary-container neon-glow" },
  pending: { label: "Submitted", color: "text-tertiary-fixed-dim", dot: "bg-tertiary-fixed-dim pulse-dot" },
  reverted: { label: "Reverted", color: "text-error", dot: "bg-error" },
} as const;

export function TxStatus({ status }: { status: string }) {
  const s = TX_STATUS[status as keyof typeof TX_STATUS] || TX_STATUS.estimating;
  return (
    <div className={"flex items-center gap-2 font-data-sm text-data-sm " + s.color}>
      <span className={"w-2 h-2 circle " + s.dot} />
      {s.label}
    </div>
  );
}

/* ---------- AgentStatus ---------- */
const AGENT_STATUS = {
  active: { label: "Active", color: "text-emerald", dot: "bg-emerald", ring: "ring-emerald/30" },
  deciding: { label: "Deciding", color: "text-amber", dot: "bg-amber pulse-amber", ring: "ring-amber/30" },
  swapping: { label: "Swapping", color: "text-violet", dot: "bg-violet pulse-dot", ring: "ring-violet/30" },
  idle: { label: "Idle", color: "text-on-surface-variant", dot: "bg-outline", ring: "ring-outline/20" },
  revoked: { label: "Revoked", color: "text-error", dot: "bg-error", ring: "ring-error/20" },
} as const;

export function AgentStatus({ status, pill = true }: { status: string; pill?: boolean }) {
  const s = AGENT_STATUS[status as keyof typeof AGENT_STATUS] || AGENT_STATUS.idle;
  if (!pill) return <span className={"w-2 h-2 circle inline-block " + s.dot} />;
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 font-label-caps text-label-caps px-2 py-1 rounded bg-surface-container-lowest/70 ring-1 " +
        s.ring + " " + s.color
      }
    >
      <span className={"w-1.5 h-1.5 circle " + s.dot} />
      {s.label}
    </span>
  );
}

/* ---------- MonoAddr ---------- */
export function MonoAddr({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1100);
      }}
      className={
        "group inline-flex items-center gap-1.5 font-data-sm text-data-sm text-on-surface-variant hover:text-on-surface transition-colors " +
        className
      }
    >
      <span>{children}</span>
      <Icon
        name={copied ? "check" : "content_copy"}
        className={"text-[13px] " + (copied ? "text-primary-container" : "opacity-0 group-hover:opacity-60")}
      />
    </button>
  );
}

/* ---------- Modal ---------- */
export function Modal({
  open,
  onClose,
  children,
  max = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  max?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm fade-up"
        style={{ animationDuration: ".2s" }}
      />
      <div
        onClick={(e) => e.stopPropagation()}
        className={"relative glass-panel rounded-xl w-full " + max + " neon-glow fade-up overflow-hidden"}
      >
        {children}
      </div>
    </div>
  );
}

/* ---------- TokenGlyph ---------- */
const TOKEN_COLORS: Record<string, string> = {
  USDC: "#00f0ff",
  WETH: "#b794ff",
  cbBTC: "#ffcf5c",
  AAVE: "#34e0a1",
  LINK: "#c0c1ff",
  aUSDC: "#34e0a1",
  crvUSD: "#89ceff",
};

export function TokenGlyph({ sym, size = 28 }: { sym: string; size?: number }) {
  const c = TOKEN_COLORS[sym] || "#849495";
  return (
    <span
      className="circle flex items-center justify-center font-label-caps shrink-0"
      style={{
        width: size,
        height: size,
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${c}55`,
        color: c,
        fontSize: size * 0.32,
      }}
    >
      {sym.slice(0, 2).toUpperCase()}
    </span>
  );
}

/* ---------- RouteCell ---------- */
export function RouteCell({ from, to }: { from: string; to: string }) {
  return (
    <div className="flex items-center gap-2 text-on-surface font-data-sm text-data-sm">
      <span>{from}</span>
      <Icon name="arrow_forward" className="text-[14px] text-outline" />
      <span>{to}</span>
    </div>
  );
}
