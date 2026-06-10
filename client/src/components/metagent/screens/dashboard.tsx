"use client";

import { useState, useEffect } from "react";
import { useBalance, useReadContract, useConnection } from "wagmi";
import { base } from "wagmi/chains";
import { type Address, formatUnits } from "viem";
import { Icon, Panel, PanelHead, Label, Tag, Btn, IconBtn, TxStatus, RouteCell } from "../primitives";
import { fetchTrades, triggerTrade, type LiveTrade } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { fmtUSD } from "@/lib/data";

const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as Address;

type TxItem = {
  id: string; from: string; to: string; venue: string; action: string;
  agent: string; amount: number; status: "estimating" | "signed" | "confirmed" | "pending" | "reverted";
  time: string; task: string; gas: number;
};

const STATUS_MAP = {
  PENDING: "estimating" as const,
  SUBMITTED: "pending" as const,
  CONFIRMED: "confirmed" as const,
  REVERTED: "reverted" as const,
};

function liveToRow(t: LiveTrade): TxItem {
  return {
    id: t.id,
    from: "USDC",
    to: (t.cioPromptJson as { target: string }).target,
    venue: "Uniswap v3",
    action: "Swap",
    agent: "CIO Agent → Swap Agent",
    amount: (t.cioPromptJson as { amount_usdc: number }).amount_usdc,
    status: STATUS_MAP[t.status],
    time: new Date(t.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    task: t.relayerTaskId ?? "—",
    gas: 0,
  };
}

export function Dashboard({
  nav,
  openTx,
  userId,
  walletAddress,
}: {
  nav: (r: string) => void;
  openTx: (tx: TxItem) => void;
  userId: string | null;
  walletAddress: string | null;
}) {
  const { address } = useConnection();
  const addr = address as Address | undefined;

  const { data: ethBal } = useBalance({ address: addr, chainId: base.id });
  const { data: usdcRaw } = useReadContract({
    address: USDC_ADDRESS,
    abi: [{ name: "balanceOf", type: "function", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" }],
    functionName: "balanceOf",
    args: [addr ?? "0x0000000000000000000000000000000000000000"],
    chainId: base.id,
    query: { enabled: !!addr },
  });

  const ethFormatted = ethBal ? parseFloat(formatUnits(ethBal.value, ethBal.decimals)) : null;
  const usdcFormatted = usdcRaw !== undefined ? parseFloat(formatUnits(usdcRaw as bigint, 6)) : null;

  const [trades, setTrades] = useState<TxItem[]>([]);

  useEffect(() => {
    if (!userId) return;
    fetchTrades(userId).then((t) => setTrades(t.map(liveToRow))).catch(() => {});
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const ch = supabase
      .channel("dash-trades")
      .on("postgres_changes", { event: "*", schema: "public", table: "TradeIntent" }, () => {
        fetchTrades(userId).then((t) => setTrades(t.map(liveToRow))).catch(() => {});
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId]);

  const ethFmt = ethFormatted !== null ? ethFormatted.toFixed(4) + " ETH" : addr ? "…" : "0.0000 ETH";
  const usdcFmt = usdcFormatted !== null ? fmtUSD(usdcFormatted, 2) : addr ? "…" : "$0.00";

  const confirmedCount = trades.filter((t) => t.status === "confirmed").length;

  return (
    <div className="space-y-gutter">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-gutter">
        {[
          { l: "USDC Balance", v: usdcFmt, sub: "Base Mainnet", icon: "attach_money", accent: "text-primary" },
          { l: "ETH Balance", v: ethFmt, sub: "Base Mainnet", icon: "currency_exchange", accent: "text-primary-fixed-dim" },
          { l: "Agent Trades", v: String(trades.length), sub: `${confirmedCount} confirmed`, icon: "swap_horiz", accent: "text-on-surface" },
          { l: "Network", v: "Base", sub: "Chain 8453 · Mainnet", icon: "lan", accent: "text-emerald" },
        ].map((k) => (
          <Panel key={k.l} className="p-5">
            <div className="flex items-center justify-between">
              <Label>{k.l}</Label>
              <Icon name={k.icon} className="text-on-surface-variant text-[18px]" />
            </div>
            <div className={"font-data-lg text-[26px] mt-3 tabular " + k.accent}>{k.v}</div>
            <div className="font-data-sm text-[12px] text-on-surface-variant mt-1">{k.sub}</div>
          </Panel>
        ))}
      </div>

      {/* Main row */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter">
        {/* Wallet panel */}
        <Panel glow className="xl:col-span-8 p-6 flex flex-col justify-between relative overflow-hidden min-h-[340px]">
          <div className="absolute top-0 right-0 p-4 opacity-[0.07] pointer-events-none">
            <Icon name="account_balance_wallet" className="text-[150px]" />
          </div>
          <PanelHead
            title="Connected Treasury"
            sub="Wallet balances on Base Mainnet"
            live
            right={<IconBtn name="more_vert" />}
          />
          <div className="relative z-10 mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <Label className="mb-2">USDC Balance</Label>
              <div className="font-display-lg text-display-lg text-primary tracking-tight tabular">
                {usdcFormatted !== null
                  ? <>{fmtUSD(Math.floor(usdcFormatted))}<span className="text-primary/50 text-headline-md">.{usdcFormatted.toFixed(2).split(".")[1]}</span></>
                  : <span className="text-primary/40 text-headline-md">$0.00</span>
                }
              </div>
              <div className="font-data-sm text-data-sm text-on-surface-variant mt-2">Available · not yet delegated</div>
            </div>
            <div className="border-t md:border-t-0 md:border-l border-outline-variant/20 pt-4 md:pt-0 md:pl-8">
              <Label className="mb-2">ETH Balance</Label>
              <div className="font-headline-md text-headline-md text-primary-fixed-dim tabular">
                {ethFmt}
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between font-data-sm text-data-sm">
                  <span className="text-on-surface-variant">Agent trades run</span>
                  <span className="text-on-surface tabular">{trades.length}</span>
                </div>
                <div className="flex justify-between font-data-sm text-data-sm">
                  <span className="text-on-surface-variant">Confirmed trades</span>
                  <span className="text-primary-container tabular">{confirmedCount}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 flex gap-2">
            <Btn variant="ghost" icon="science" onClick={() => nav("demo")}>View Demo</Btn>
            <Btn variant="ghost" icon="key" onClick={() => nav("permissions")}>Permissions</Btn>
          </div>
        </Panel>

        <CIOTerminal className="xl:col-span-4" onOpenAgents={() => nav("agents")} userId={userId} />
      </div>

      {/* Live activity */}
      <Panel className="p-0 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center">
          <h3 className="font-headline-md text-headline-md text-on-surface">Live Activity</h3>
          <button
            onClick={() => nav("activity")}
            className="font-data-sm text-data-sm text-on-surface-variant hover:text-primary-fixed-dim transition-colors flex items-center gap-1"
          >
            View All <Icon name="arrow_forward" className="text-[15px]" />
          </button>
        </div>
        {trades.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Icon name="swap_horiz" className="text-[40px] text-on-surface-variant/30 mb-3" />
            <p className="font-data-sm text-data-sm text-on-surface-variant">No agent trades yet.</p>
            <p className="font-data-sm text-[12px] text-outline mt-1">Run the CIO Agent to generate your first trade intent.</p>
          </div>
        ) : (
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
                {trades.slice(0, 4).map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => openTx(a)}
                    className="border-b border-outline-variant/10 hover:bg-surface-container-high/30 transition-colors cursor-pointer"
                  >
                    <td className="p-4">
                      <RouteCell from={a.from} to={a.to} />
                      <div className="text-on-surface-variant text-[12px] mt-1">{a.venue}</div>
                    </td>
                    <td className="p-4 text-on-surface-variant">{a.agent}</td>
                    <td className="p-4 text-on-surface text-right tabular">{fmtUSD(a.amount, 2)}</td>
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

function CIOTerminal({ className = "", onOpenAgents, userId }: { className?: string; onOpenAgents: () => void; userId: string | null }) {
  const [log, setLog] = useState<Array<{ t: string; kind: string; text: string }>>([]);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<{ taskId: string; intent: { target: string; amount_usdc: number } } | null>(null);
  const [runError, setRunError] = useState<string | null>(null);

  const handleRunAgent = async () => {
    if (!userId || running) return;
    setRunning(true);
    setRunError(null);
    setRunResult(null);
    const ts = () => new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLog([{ t: ts(), kind: "INFO", text: "Starting CIO Agent…" }]);
    try {
      const result = await triggerTrade(userId);
      setLog((prev) => [
        ...prev,
        { t: ts(), kind: "INFO", text: "Market analysis complete." },
        { t: ts(), kind: "REASONING", text: `Target asset: ${(result.intent as { target: string }).target} · Amount: $${(result.intent as { amount_usdc: number }).amount_usdc.toLocaleString()} USDC` },
        { t: ts(), kind: "INTENT", text: JSON.stringify(result.intent) },
        { t: ts(), kind: "RELAY", text: `Pushed to 1Shot relayer · task ${result.taskId}` },
      ]);
      setRunResult({ taskId: result.taskId, intent: result.intent as { target: string; amount_usdc: number } });
    } catch (e) {
      setLog((prev) => [...prev, { t: ts(), kind: "ERROR", text: String(e) }]);
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
    ERROR: "text-error",
  };

  return (
    <Panel className={"p-0 flex flex-col border border-outline-variant/30 overflow-hidden " + className}>
      <div className="p-4 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-highest/40">
        <h3 className="font-data-lg text-data-lg text-on-surface flex items-center gap-2">
          <Icon name="neurology" className="text-primary-container text-[18px]" />
          CIO Agent
        </h3>
        <Tag className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-amber circle pulse-amber inline-block" />
          Llama 3.3 / Venice AI
        </Tag>
      </div>
      <div className="flex-1 p-4 bg-surface-container-lowest/80 font-data-sm text-data-sm text-on-surface-variant overflow-y-auto max-h-[300px] xl:max-h-none flex flex-col gap-2.5 min-h-[180px]">
        {log.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-4">
            <Icon name="neurology" className="text-[28px] text-on-surface-variant/30 mb-2" />
            <p className="text-[12px] text-outline">Hit Run Agent to start the CIO reasoning cycle.</p>
          </div>
        ) : (
          log.map((l, i) => (
            <div key={i} className="flex gap-2 fade-up">
              <span className="text-outline shrink-0">[{l.t}]</span>
              <span>
                <span className={(KIND[l.kind] || "") + " font-bold"}>{l.kind}: </span>
                <span className={l.kind === "REASONING" || l.kind === "INTENT" ? "text-on-surface" : ""}>{l.text}</span>
              </span>
            </div>
          ))
        )}
        <div className="flex gap-2 items-center mt-1">
          <span className="text-outline">&gt;</span>
          <span className="w-1.5 h-3.5 bg-primary-container inline-block blink" />
        </div>
      </div>
      {runResult && (
        <div className="px-4 py-2 font-data-sm text-[12px] text-primary-container bg-primary-container/5 border-t border-primary-container/20 space-y-1">
          <p className="flex items-center gap-1.5"><Icon name="check_circle" className="text-emerald text-[14px]" /> Intent submitted · task {runResult.taskId.slice(0, 12)}…</p>
          <p className="text-on-surface-variant">Target: {runResult.intent.target} · ${runResult.intent.amount_usdc.toLocaleString()} USDC</p>
        </div>
      )}
      {runError && (
        <div className="px-4 py-2 font-data-sm text-[12px] text-error bg-error/5 border-t border-error/20">
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
