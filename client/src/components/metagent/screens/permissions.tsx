"use client";

import { useState, useEffect } from "react";
import { Icon, Panel, PanelHead, Label, Tag, Btn, IconBtn, MonoAddr, Modal } from "../primitives";
import { Bar } from "../charts";
import * as D from "@/lib/data";

export function Permissions({ openGrant }: { openGrant: () => void }) {
  const t = D.treasury;
  const usedPct = Math.round((t.masterUsed / t.masterBudget) * 100);
  const totalDelegated = D.burnerKeys
    .filter((k) => k.status === "active")
    .reduce((s, k) => s + k.limit, 0);

  return (
    <div className="space-y-gutter">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface">
            Permissions & Delegation
          </h2>
          <p className="font-data-sm text-data-sm text-on-surface-variant mt-1">
            Cryptographically-bounded budgets. Agents act only within these caveats.
          </p>
        </div>
        <Btn icon="add_moderator" onClick={openGrant}>New Sub-Delegation</Btn>
      </div>

      {/* Master permission */}
      <Panel glow className="p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-[0.06] pointer-events-none">
          <Icon name="verified_user" className="text-[150px]" />
        </div>
        <div className="grid lg:grid-cols-12 gap-8 relative z-10">
          <div className="lg:col-span-7">
            <PanelHead
              title="Master Operating Permission"
              sub="Granted by owner via wallet_grantPermissions"
              live
              right={<Tag>ERC-7715</Tag>}
            />
            <div className="flex justify-between font-data-sm text-data-sm mb-2">
              <span className="text-on-surface">Budget consumed</span>
              <span className="text-primary-container">
                {usedPct}% · {D.fmtUSD(t.masterUsed)} of {D.fmtUSD(t.masterBudget)}
              </span>
            </div>
            <Bar pct={usedPct} h="h-1.5" shimmer />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              {[["Token", "USDC"], ["Network", "Base"], ["Period", "Monthly"], ["Resets", "in 12d"]].map(([l, v]) => (
                <div key={l}>
                  <Label className="mb-1.5 normal-case">{l}</Label>
                  <div className="font-data-sm text-data-sm text-on-surface">{v}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-5 lg:border-l border-outline-variant/15 lg:pl-8 space-y-4">
            <Label>Permission Context</Label>
            <div className="bg-surface-container-lowest/70 border border-outline-variant/15 rounded-lg p-3 font-data-sm text-[12px] text-on-surface-variant space-y-1.5">
              {[
                ["delegator", D.user.address],
                ["delegate", "0xDeleg…7710"],
                ["scope", "Erc20Periodic"],
                ["enforcer", "AllowedTargets"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span>{k}</span>
                  <span className="text-on-surface">{v}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Btn variant="ghost" className="flex-1" icon="add" onClick={openGrant}>Increase</Btn>
              <Btn variant="danger" icon="block">Revoke All</Btn>
            </div>
          </div>
        </div>
      </Panel>

      {/* Allocation summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-gutter">
        {[
          { l: "Active Delegations", v: "4", icon: "key", c: "text-on-surface" },
          { l: "Total Delegated", v: D.fmtUSD(totalDelegated), icon: "savings", c: "text-on-surface" },
          { l: "Spent this period", v: D.fmtUSD(t.masterUsed), icon: "payments", c: "text-primary" },
          { l: "Headroom", v: D.fmtUSD(t.masterBudget - t.masterUsed), icon: "data_usage", c: "text-emerald" },
        ].map((k) => (
          <Panel key={k.l} className="p-5">
            <div className="flex items-center justify-between">
              <Label>{k.l}</Label>
              <Icon name={k.icon} className="text-on-surface-variant text-[18px]" />
            </div>
            <div className={"font-data-lg text-[24px] mt-3 tabular " + k.c}>{k.v}</div>
          </Panel>
        ))}
      </div>

      {/* Sub-delegations table */}
      <Panel className="p-0 overflow-hidden">
        <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center">
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface">Sub-Delegations</h3>
            <p className="font-data-sm text-data-sm text-on-surface-variant mt-1">
              Burner keys bound by caveat · ERC-7710 redelegatePermissionContext
            </p>
          </div>
          <Tag>5 KEYS</Tag>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/20 bg-surface-container-lowest/50 font-label-caps text-label-caps text-on-surface-variant">
                <th className="p-4 font-normal">Agent / Burner Key</th>
                <th className="p-4 font-normal">Allowed Target</th>
                <th className="p-4 font-normal">Caveat</th>
                <th className="p-4 font-normal w-48">Spent / Limit</th>
                <th className="p-4 font-normal">Expires</th>
                <th className="p-4 font-normal text-right">State</th>
              </tr>
            </thead>
            <tbody>
              {D.burnerKeys.map((k, i) => {
                const pct = Math.round((k.used / k.limit) * 100);
                const revoked = k.status === "revoked";
                return (
                  <tr
                    key={i}
                    className={
                      "border-b border-outline-variant/10 transition-colors " +
                      (revoked ? "opacity-50" : "hover:bg-surface-container-high/30")
                    }
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded bg-surface-container flex items-center justify-center border border-outline-variant/20">
                          <Icon name={k.icon} className="text-[15px] text-secondary-fixed-dim" />
                        </span>
                        <div>
                          <div className="font-data-sm text-data-sm text-on-surface">{k.agent}</div>
                          <div className="font-data-sm text-[12px] text-on-surface-variant">{k.address}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-data-sm text-data-sm text-on-surface-variant">{k.target}</td>
                    <td className="p-4">
                      <span className="font-data-sm text-[12px] text-tertiary-fixed-dim bg-tertiary-fixed-dim/10 px-2 py-1 rounded border border-tertiary-fixed-dim/20">
                        {k.scope}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-between font-data-sm text-[12px] mb-1.5 tabular">
                        <span className="text-on-surface">{D.fmtUSD(k.used)}</span>
                        <span className="text-on-surface-variant">{D.fmtUSD(k.limit)}</span>
                      </div>
                      <Bar
                        pct={pct}
                        color={revoked ? "bg-error" : pct >= 100 ? "bg-amber" : "bg-primary-container"}
                      />
                    </td>
                    <td className="p-4 font-data-sm text-data-sm text-on-surface-variant">{k.expires}</td>
                    <td className="p-4 text-right">
                      {revoked ? (
                        <span className="font-label-caps text-label-caps text-error">REVOKED</span>
                      ) : (
                        <button className="font-label-caps text-label-caps text-on-surface-variant hover:text-error transition-colors">
                          REVOKE
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

export function GrantModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [agent, setAgent] = useState("Swap Agent (Alpha)");
  const [target, setTarget] = useState("Uniswap v3");
  const [limit, setLimit] = useState(100000);
  const [done, setDone] = useState(false);

  useEffect(() => { if (open) setDone(false); }, [open]);

  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-5 border-b border-outline-variant/15 flex items-center justify-between">
        <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
          <Icon name="add_moderator" className="text-primary-fixed-dim text-[20px]" />
          New Sub-Delegation
        </h3>
        <IconBtn name="close" onClick={onClose} />
      </div>

      {!done ? (
        <div className="p-5 space-y-5">
          <p className="font-data-sm text-data-sm text-on-surface-variant">
            Mint a fresh burner key and bind it to a narrowed caveat via{" "}
            <span className="text-on-surface">redelegatePermissionContext</span>.
          </p>
          <div>
            <Label className="mb-2">Delegate to</Label>
            <div className="grid grid-cols-2 gap-2">
              {["Swap Agent (Alpha)", "Swap Agent (Beta)", "Yield Manager", "LP Manager"].map((a) => (
                <button
                  key={a}
                  onClick={() => setAgent(a)}
                  className={
                    "font-data-sm text-data-sm py-2.5 px-3 rounded border text-left transition-colors " +
                    (agent === a
                      ? "border-primary-container/60 text-on-surface bg-primary-container/10"
                      : "border-outline-variant/30 text-on-surface-variant hover:text-on-surface")
                  }
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="mb-2">Allowed target (caveat)</Label>
            <div className="grid grid-cols-3 gap-2">
              {["Uniswap v3", "Curve", "Aave v3"].map((tg) => (
                <button
                  key={tg}
                  onClick={() => setTarget(tg)}
                  className={
                    "font-data-sm text-[12px] py-2.5 rounded border transition-colors " +
                    (target === tg
                      ? "border-primary-container/60 text-primary-container bg-primary-container/10"
                      : "border-outline-variant/30 text-on-surface-variant hover:text-on-surface")
                  }
                >
                  {tg}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="mb-2">Spend limit (ERC20TransferAmount)</Label>
            <div className="flex items-center gap-2 bg-surface-container-lowest/60 border border-outline-variant/30 rounded-lg px-4 py-3">
              <span className="font-data-lg text-data-lg text-on-surface-variant">$</span>
              <input
                type="text"
                value={limit.toLocaleString("en-US")}
                onChange={(e) => {
                  const n = +e.target.value.replace(/[^0-9]/g, "");
                  setLimit(isNaN(n) ? 0 : n);
                }}
                className="flex-1 bg-transparent border-none font-data-lg text-data-lg text-on-surface tabular p-0 focus:ring-0"
              />
              <span className="font-label-caps text-label-caps text-on-surface-variant">USDC</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest/60 border border-outline-variant/15 rounded-lg p-4 space-y-2">
            {[
              ["Enforcer", "AllowedTargets + ERC20TransferAmount"],
              ["Authority", "Master 0xDeleg…7710"],
              ["Burner key", "generated on sign"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between font-data-sm text-[12px]">
                <span className="text-on-surface-variant">{k}</span>
                <span className="text-on-surface">{v}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Btn variant="ghost" className="flex-1" onClick={onClose}>Cancel</Btn>
            <Btn className="flex-1" icon="vpn_key" onClick={() => setDone(true)}>
              Sign & Delegate
            </Btn>
          </div>
        </div>
      ) : (
        <div className="p-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-primary-container/10 border border-primary-container/40 flex items-center justify-center neon-glow">
            <Icon name="check" className="text-primary-fixed-dim text-[32px]" />
          </div>
          <h3 className="font-headline-md text-headline-md text-on-surface mt-5">
            Sub-delegation signed
          </h3>
          <p className="font-data-sm text-data-sm text-on-surface-variant mt-2 max-w-xs">
            {agent} can now spend up to ${limit.toLocaleString("en-US")} USDC on {target}.
          </p>
          <Btn className="mt-6 px-8" onClick={onClose}>Done</Btn>
        </div>
      )}
    </Modal>
  );
}
