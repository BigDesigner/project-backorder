import React, { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { useToast } from "../Toast";

export function SettingsView() {
  const toast = useToast();
  const [testingNotify, setTestingNotify] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetInput, setResetInput] = useState("");
  const [resetting, setResetting] = useState(false);

  // 2FA State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorLoading, setTwoFactorLoading] = useState(true);
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [setupSecret, setSetupSecret] = useState("");
  const [setupUri, setSetupUri] = useState("");
  const [setupOtp, setSetupOtp] = useState("");
  const [setupSubmitting, setSetupSubmitting] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);

  // Disable 2FA State
  const [disableModalOpen, setDisableModalOpen] = useState(false);
  const [disableOtp, setDisableOtp] = useState("");
  const [disableSubmitting, setDisableSubmitting] = useState(false);

  const CONFIRM_PHRASE = "yes-i-know-all-database-rows-deleted";

  useEffect(() => {
    load2FAStatus();
  }, []);

  async function load2FAStatus() {
    try {
      const res = await api.twoFactorStatus();
      setTwoFactorEnabled(res.enabled);
    } catch {
      // Ignore if not authed
    } finally {
      setTwoFactorLoading(false);
    }
  }

  async function handleStartSetup() {
    setSetupError(null);
    setSetupOtp("");
    try {
      const res = await api.twoFactorSetup();
      setSetupSecret(res.secret);
      setSetupUri(res.uri);
      setSetupModalOpen(true);
    } catch (e: any) {
      toast.push(e?.message || "Failed to initialize 2FA setup");
    }
  }

  async function handleVerifySetup(e: React.FormEvent) {
    e.preventDefault();
    if (!setupOtp || setupSubmitting) return;
    setSetupSubmitting(true);
    setSetupError(null);
    try {
      await api.twoFactorVerify(setupOtp);
      toast.push("Two-Factor Authentication successfully enabled!");
      setTwoFactorEnabled(true);
      setSetupModalOpen(false);
    } catch (err: any) {
      setSetupError(err?.message || "Verification failed. Check your 6-digit code.");
    } finally {
      setSetupSubmitting(false);
    }
  }

  async function handleDisable2FA(e: React.FormEvent) {
    e.preventDefault();
    setDisableSubmitting(true);
    try {
      await api.twoFactorDisable(disableOtp);
      toast.push("Two-Factor Authentication has been disabled.");
      setTwoFactorEnabled(false);
      setDisableModalOpen(false);
      setDisableOtp("");
    } catch (err: any) {
      toast.push(err?.message || "Failed to disable 2FA.");
    } finally {
      setDisableSubmitting(false);
    }
  }

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
          Telemetry health, security protocols, and database maintenance
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
              <span className="text-on-surface-variant">2FA Standard</span>
              <span className="font-mono text-secondary font-medium">RFC 6238 TOTP (Web Crypto)</span>
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
          {/* Two-Factor Authentication (2FA) */}
          <div className="bg-surface-container rounded-xl p-6 border border-outline-variant/60 shadow-xl flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-on-surface">Two-Factor Authentication (2FA)</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Protect operator login with Google Authenticator / 1Password
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-label-caps text-[10px] uppercase font-bold ${
                  twoFactorEnabled
                    ? "bg-primary-container/20 text-primary-container"
                    : "bg-surface-container-high text-on-surface-variant"
                }`}
              >
                {twoFactorEnabled && <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse" />}
                {twoFactorLoading ? "CHECKING..." : twoFactorEnabled ? "2FA ACTIVE" : "DISABLED"}
              </span>
            </div>

            {twoFactorEnabled ? (
              <button
                onClick={() => {
                  setDisableOtp("");
                  setDisableModalOpen(true);
                }}
                className="w-full py-2.5 rounded-lg bg-surface-container-high hover:bg-error-container/20 border border-outline-variant hover:border-error/40 text-xs text-on-surface hover:text-error font-medium transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">lock_open</span>
                <span>Disable Two-Factor Authentication</span>
              </button>
            ) : (
              <button
                onClick={handleStartSetup}
                className="w-full py-2.5 rounded-lg bg-primary-container hover:bg-surface-tint text-on-primary-fixed text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-2 active:scale-98"
              >
                <span className="material-symbols-outlined text-[18px]">security</span>
                <span>Configure Authenticator App (2FA)</span>
              </button>
            )}
          </div>

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

      {/* 2FA SETUP MODAL */}
      {setupModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSetupModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-surface-container rounded-xl border border-outline-variant p-6 shadow-2xl flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-outline-variant/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container text-[22px]">security</span>
                <h3 className="font-semibold text-lg text-on-surface">Enable Two-Factor Authentication</h3>
              </div>
              <button
                type="button"
                onClick={() => setSetupModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Scan this QR code with Google Authenticator, 1Password, or Authy. Alternatively, enter the setup key
              manually into your authenticator app.
            </p>

            {/* QR Code and Key */}
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/40">
              <div className="w-36 h-36 bg-white p-2 rounded-lg flex items-center justify-center shrink-0">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(setupUri)}`}
                  alt="2FA QR Code"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex flex-col gap-2 w-full overflow-hidden">
                <span className="font-label-caps text-[10px] text-on-surface-variant">MANUAL SETUP SECRET</span>
                <div className="p-2 rounded bg-surface-container font-mono text-xs text-primary-container select-all break-all border border-outline-variant/40">
                  {setupSecret}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(setupSecret);
                    toast.push("Setup secret copied to clipboard!");
                  }}
                  className="self-start text-[11px] font-medium text-secondary hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">content_copy</span>
                  <span>Copy Secret Key</span>
                </button>
              </div>
            </div>

            {setupError && (
              <div className="p-2.5 rounded-lg bg-error-container/30 border border-error/30 text-error text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{setupError}</span>
              </div>
            )}

            {/* Verification Form */}
            <form onSubmit={handleVerifySetup} className="flex flex-col gap-3 pt-2">
              <label className="text-xs font-label-code text-on-surface uppercase tracking-wider">
                Enter 6-Digit Code To Verify Setup
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={6}
                  placeholder="123456"
                  value={setupOtp}
                  onChange={(e) => setSetupOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="flex-1 bg-surface-container-lowest text-primary-container font-mono text-xl font-bold tracking-[0.3em] text-center px-3 py-2 rounded-lg border border-outline-variant outline-none focus:border-primary-container"
                />
                <button
                  type="submit"
                  disabled={setupSubmitting || setupOtp.length !== 6}
                  className="px-5 py-2 rounded-lg bg-primary-container hover:bg-surface-tint text-on-primary-fixed text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span>{setupSubmitting ? "Verifying..." : "Activate 2FA"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2FA DISABLE CONFIRMATION MODAL */}
      {disableModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setDisableModalOpen(false)} />
          <div className="relative w-full max-w-md bg-surface-container rounded-xl border border-outline-variant p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-2 text-on-surface">
              <span className="material-symbols-outlined text-amber-400 text-[22px]">lock_open</span>
              <h3 className="font-semibold text-lg">Disable Two-Factor Authentication</h3>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Are you sure you want to disable 2FA? Your account will only be protected by email and password.
            </p>
            <form onSubmit={handleDisable2FA} className="flex flex-col gap-3 pt-2">
              <label className="text-xs font-label-code text-on-surface uppercase tracking-wider">
                Enter 6-Digit Authenticator Code (Optional confirmation)
              </label>
              <input
                type="text"
                autoFocus
                maxLength={6}
                placeholder="123456"
                value={disableOtp}
                onChange={(e) => setDisableOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full bg-surface-container-lowest text-on-surface font-mono text-lg font-bold tracking-[0.3em] text-center px-3 py-2 rounded-lg border border-outline-variant outline-none focus:border-error"
              />
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDisableModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-on-surface-variant hover:text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={disableSubmitting}
                  className="px-4 py-2 rounded-lg bg-error hover:bg-error/90 text-on-error text-xs font-bold transition-all disabled:opacity-50"
                >
                  {disableSubmitting ? "Disabling..." : "Confirm Deactivation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
