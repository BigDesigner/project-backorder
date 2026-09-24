import React, { useState } from "react";
import { api } from "../../lib/api";
import { useToast } from "../Toast";

export function SettingsView() {
  const toast = useToast();
  const [testingNotify, setTestingNotify] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetInput, setResetInput] = useState("");
  const [resetting, setResetting] = useState(false);

  const CONFIRM_PHRASE = "yes-i-know-all-database-rows-deleted";

  async function handleTestNotify() {
    setTestingNotify(true);
    try {
      await api.testNotify();
      toast.push("Test webhook alert dispatched successfully!");
    } catch (e: any) {
      toast.push(e?.message || "Failed to dispatch test notification.");
    } finally {
      setTestingNotify(false);
    }
  }

  async function handleCleanEvents() {
    setCleaning(true);
    try {
      const res = await api.cleanEvents();
      toast.push(`Purged ${res.removed} telemetry events older than 30 days.`);
    } catch (e: any) {
      toast.push(e?.message || "Failed to clean events.");
    } finally {
      setCleaning(false);
    }
  }

  async function handleFactoryReset() {
    if (resetInput !== CONFIRM_PHRASE) return;
    setResetting(true);
    try {
      await api.factoryReset();
      toast.push("System database has been completely re-initialized.");
      setResetOpen(false);
      setTimeout(() => window.location.reload(), 1000);
    } catch (e: any) {
      toast.push(e?.message || "Factory reset failed.");
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight text-on-surface">System Configuration</h2>
          <span className="font-label-caps px-2 py-0.5 rounded bg-surface-container-high text-secondary border border-outline-variant text-[10px]">
            OPS CONTROL
          </span>
        </div>
        <p className="text-xs text-on-surface-variant mt-1">
          Telemetry telemetry health, edge connectivity, and database maintenance
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Infrastructure Telemetry */}
        <div className="bg-surface-container rounded-xl p-6 border border-outline-variant/60 shadow-xl flex flex-col gap-6">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-on-surface">Edge Telemetry Stack</h3>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary-container/20 text-primary-container font-label-caps text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse" />
                ONLINE
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">Core serverless infrastructure status</p>
          </div>

          <div className="flex flex-col divide-y divide-outline-variant/20 text-xs">
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-on-surface-variant">Storage Layer</span>
              <span className="font-mono text-on-surface font-medium">Cloudflare D1 (SQLite Engine)</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-on-surface-variant">Runtime Environment</span>
              <span className="font-mono text-on-surface font-medium">Cloudflare Workers (Vite/TS/Hono)</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-on-surface-variant">Security Protocol</span>
              <span className="font-mono text-primary-container font-medium">SEC-07 PBKDF2-HMAC Fingerprint</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-on-surface-variant">Input Shield</span>
              <span className="font-mono text-secondary font-medium">SEC-13 Strict Regex Filter</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-on-surface-variant">Rate Limiting</span>
              <span className="font-mono text-on-surface font-medium">SEC-08 IP Isolated (5 fails/min)</span>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-surface-container-lowest border border-outline-variant/40 flex flex-col gap-2">
            <span className="font-label-caps text-[10px] text-secondary">OPERATIONAL TELEMETRY RULES</span>
            <ul className="text-xs text-on-surface-variant space-y-1.5 leading-relaxed">
              <li className="flex gap-2">
                <span className="text-secondary">•</span>
                <span>Automated 1200ms stagger between domain checks prevents public RDAP node bans.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-secondary">•</span>
                <span>Turkish domains (.tr) are dynamically routed via Trabis/IANA resolvers.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-secondary">•</span>
                <span>Designed to stay strictly within Cloudflare Always-Free monthly invocation quotas.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: Maintenance & Actions */}
        <div className="flex flex-col gap-6">
          {/* Dispatch Hooks */}
          <div className="bg-surface-container rounded-xl p-6 border border-outline-variant/60 shadow-xl flex flex-col gap-4">
            <div>
              <h3 className="text-base font-semibold text-on-surface">Telemetry Alert Dispatch</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Verify webhook connectivity to Discord and Telegram
              </p>
            </div>

            <button
              onClick={handleTestNotify}
              disabled={testingNotify}
              className="w-full py-2.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant text-xs text-on-surface font-medium transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-secondary text-[18px]">send</span>
              <span>{testingNotify ? "Dispatching Ping..." : "Dispatch Test Webhook Notification"}</span>
            </button>
          </div>

          {/* Database Maintenance */}
          <div className="bg-surface-container rounded-xl p-6 border border-outline-variant/60 shadow-xl flex flex-col gap-4">
            <div>
              <h3 className="text-base font-semibold text-on-surface">Data Retention & Maintenance</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">Manage event logs and factory reset</p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleCleanEvents}
                disabled={cleaning}
                className="w-full py-2.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant text-xs text-on-surface font-medium transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">mop</span>
                <span>{cleaning ? "Purging Records..." : "Purge Telemetry Logs (> 30 days old)"}</span>
              </button>

              <div className="pt-2 border-t border-outline-variant/40 flex flex-col gap-2">
                <span className="font-label-caps text-error text-[10px]">DANGER ZONE</span>
                <button
                  onClick={() => {
                    setResetInput("");
                    setResetOpen(true);
                  }}
                  className="w-full py-2.5 rounded-lg bg-error-container/20 hover:bg-error-container/30 border border-error/30 text-xs text-error font-semibold transition-all flex items-center justify-center gap-2 active:scale-98"
                >
                  <span className="material-symbols-outlined text-[18px]">warning</span>
                  <span>Initiate Factory Reset</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Factory Reset Modal with Type-to-Confirm */}
      {resetOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setResetOpen(false)} />
          <div className="relative w-full max-w-lg bg-surface-container rounded-xl border border-error/40 p-6 shadow-2xl overflow-hidden flex flex-col gap-4">
            <div className="flex items-center gap-3 text-error">
              <div className="w-10 h-10 rounded-lg bg-error-container/30 border border-error/40 flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">bomb</span>
              </div>
              <div>
                <h3 className="font-semibold text-lg text-on-surface">Irreversible Action: Factory Reset</h3>
                <p className="text-xs text-on-surface-variant font-label-code">D1 DATABASE PURGE</p>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-error-container/20 border border-error/30 text-xs text-on-surface leading-relaxed">
              This operation will permanently purge all tracked domain targets, telemetry event records, and SQLite
              sequences. This cannot be undone.
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-label-code text-on-surface">
                Type <code className="bg-surface-container-lowest px-1.5 py-0.5 rounded text-primary-container">{CONFIRM_PHRASE}</code> to confirm:
              </label>
              <input
                type="text"
                autoFocus
                placeholder="Type confirmation phrase here..."
                value={resetInput}
                onChange={(e) => setResetInput(e.target.value)}
                className="w-full bg-surface-container-lowest text-on-surface font-mono text-xs px-3 py-2.5 rounded-lg border border-error/40 outline-none focus:border-error"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setResetOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-on-surface-variant hover:text-on-surface transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={resetInput !== CONFIRM_PHRASE || resetting}
                onClick={handleFactoryReset}
                className="px-4 py-2 rounded-lg bg-error hover:bg-error/90 text-on-error text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-md"
              >
                <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                <span>{resetting ? "Purging Entire Database..." : "Destroy Everything"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
