import React, { useState } from "react";

interface LoginViewProps {
  onLogin: (email: string, pass: string, otp?: string) => Promise<{ require2fa?: boolean } | void>;
  loading: boolean;
}

export function LoginView({ onLogin, loading }: LoginViewProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"credentials" | "2fa">("credentials");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      if (step === "credentials") {
        const res = await onLogin(email, password);
        if (res && res.require2fa) {
          setStep("2fa");
        }
      } else {
        await onLogin(email, password, otp);
      }
    } catch (err: any) {
      setError(err?.message || "Authentication failed");
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
              <span className="material-symbols-outlined text-primary-container text-[24px]">
                {step === "2fa" ? "lock_clock" : "radar"}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-on-surface">DomainPulse</h1>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {step === "2fa" ? "Two-Factor Verification" : "Sign in to access your monitor"}
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-error-container/30 border border-error/30 text-error text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {step === "credentials" ? (
              <>
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
                      placeholder="name@example.com"
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
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              /* STEP 2: 2FA CODE ENTRY */
              <>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="font-label-code text-xs text-on-surface uppercase tracking-wider">
                      6-Digit Security Code
                    </label>
                    <span className="font-label-caps text-secondary text-[10px]">AUTHENTICATOR APP</span>
                  </div>
                  <input
                    type="text"
                    required
                    autoFocus
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full bg-surface-container-lowest text-primary-container font-mono text-3xl font-bold tracking-[0.4em] text-center py-3.5 rounded-lg border border-primary-container/40 outline-none focus:border-primary-container transition-colors shadow-inner"
                  />
                  <p className="text-[11px] text-on-surface-variant text-center">
                    Enter the time-based token from your Google Authenticator or 1Password app.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting || otp.length !== 6}
                  className="mt-2 w-full py-3 rounded-lg bg-primary-container hover:bg-surface-tint text-on-primary-fixed font-semibold text-sm transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                      <span>Verifying Token...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">verified_user</span>
                      <span>Verify & Enter</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep("credentials");
                    setOtp("");
                    setError(null);
                  }}
                  className="text-xs text-on-surface-variant hover:text-on-surface text-center transition-colors"
                >
                  ← Back to Email & Password
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
