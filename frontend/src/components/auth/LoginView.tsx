import React, { useState } from "react";

interface LoginViewProps {
  onLogin: (email: string, pass: string) => Promise<void>;
  loading: boolean;
}

export function LoginView({ onLogin, loading }: LoginViewProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password || submitting) return;
    setSubmitting(true);
    try {
      await onLogin(email, password);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md bg-surface-container rounded-xl p-8 border border-outline-variant shadow-2xl relative overflow-hidden">
        {/* Subtle Ambient Telemetry Glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 rounded-full bg-primary-container/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-6">
          {/* Header */}
          <div className="text-center flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-surface-container-high border border-outline-variant flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-primary-container text-[24px]">radar</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-on-surface">DomainPulse</h1>
              <p className="text-xs text-on-surface-variant font-label-code mt-0.5">
                TELEMETRY ACCESS GATEWAY • SEC-07 VERIFIED
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-label-code text-xs text-on-surface uppercase tracking-wider">
                Operator Email
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-outline text-[18px]">
                  alternate_email
                </span>
                <input
                  type="email"
                  required
                  placeholder="admin@gnn.tr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-container-lowest text-on-surface font-body-md pl-10 pr-3 py-2.5 rounded-lg border border-outline-variant outline-none focus:border-secondary transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-label-code text-xs text-on-surface uppercase tracking-wider">
                Password
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-outline text-[18px]">
                  key
                </span>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-container-lowest text-on-surface font-body-md pl-10 pr-3 py-2.5 rounded-lg border border-outline-variant outline-none focus:border-secondary transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || loading}
              className="mt-2 w-full py-3 rounded-lg bg-primary-container hover:bg-surface-tint text-on-primary-fixed font-semibold text-sm transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                  <span>Authenticating Telemetry...</span>
                </>
              ) : (
                <>
                  <span>Initialize Session</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="flex items-center justify-center gap-2 pt-2 text-[11px] text-on-surface-variant font-label-code border-t border-outline-variant/50">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
            <span>Encrypted PBKDF2-SHA256 • IP Rate Limiting Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
