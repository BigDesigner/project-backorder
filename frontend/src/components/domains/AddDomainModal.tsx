import React, { useState } from "react";

interface AddDomainModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (domain: string, label?: string, intervalMin?: number) => Promise<void>;
  onBulkAdd: (domains: string[], intervalMin?: number) => Promise<void>;
}

export function AddDomainModal({ open, onClose, onAdd, onBulkAdd }: AddDomainModalProps) {
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [domain, setDomain] = useState("");
  const [label, setLabel] = useState("");
  const [interval, setInterval] = useState(60);
  const [bulkInput, setBulkInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const cadenceOptions = [
    { value: 30, title: "30 min", meta: "BALANCED" },
    { value: 60, title: "60 min", meta: "OPTIMAL", recommended: true },
    { value: 120, title: "2 hours", meta: "STANDARD" },
    { value: 360, title: "6 hours", meta: "CONSERVATIVE" },
    { value: 1440, title: "24 hours", meta: "ECO PASSIVE" },
  ];

  async function handleSingleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");

    if (!cleanDomain || !cleanDomain.includes(".")) {
      setError("Please provide a valid domain name (e.g. quantumvault.ai).");
      return;
    }

    // SEC-13 client-side validation guard
    if (!/^[a-z0-9.-]+$/.test(cleanDomain)) {
      setError("Domain contains invalid characters. Only alphanumeric, hyphens, and dots allowed.");
      return;
    }

    setSubmitting(true);
    try {
      await onAdd(cleanDomain, label.trim() || undefined, interval);
      setDomain("");
      setLabel("");
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to add domain.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBulkSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const rawList = bulkInput
      .split(/[\n,]+/)
      .map((d) => d.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, ""))
      .filter((d) => d && d.includes("."));

    if (rawList.length === 0) {
      setError("No valid domain names found in your text.");
      return;
    }

    // Validate all domains against SEC-13
    const invalid = rawList.find((d) => !/^[a-z0-9.-]+$/.test(d));
    if (invalid) {
      setError(`Domain "${invalid}" contains invalid characters.`);
      return;
    }

    setSubmitting(true);
    try {
      await onBulkAdd(rawList, interval);
      setBulkInput("");
      onClose();
    } catch (err: any) {
      setError(err?.message || "Bulk import failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-surface-container rounded-xl border border-outline-variant p-6 shadow-2xl overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-secondary-container/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-outline-variant/60 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-label-caps px-2 py-0.5 rounded bg-surface-container-high text-secondary border border-outline-variant text-[10px]">
                  TELEMETRY REGISTRY
                </span>
                <span className="font-label-caps text-on-surface-variant text-[10px]">INGESTION PIPELINE</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-on-surface">Add New Target</h2>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center bg-surface-container-lowest p-1 rounded-lg border border-outline-variant/40">
              <button
                type="button"
                onClick={() => setMode("single")}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                  mode === "single"
                    ? "bg-surface-container-high text-on-surface shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Single Domain
              </button>
              <button
                type="button"
                onClick={() => setMode("bulk")}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                  mode === "bulk"
                    ? "bg-surface-container-high text-on-surface shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Bulk Import
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-error-container/30 border border-error/30 text-error text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* SINGLE MODE */}
          {mode === "single" ? (
            <form onSubmit={handleSingleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-label-code text-xs text-on-surface uppercase tracking-wider">
                  Target Domain FQDN <span className="text-secondary">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 font-label-code text-xs text-outline select-none">
                    whois://
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="quantumvault.ai"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="w-full bg-surface-container-lowest text-on-surface font-mono text-sm pl-20 pr-3 py-2.5 rounded-lg border border-outline-variant outline-none focus:border-secondary transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-label-code text-xs text-on-surface uppercase tracking-wider">
                  Portfolio Label / Client <span className="text-on-surface-variant font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. High Priority Acquisition, Client X"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full bg-surface-container-lowest text-on-surface text-xs px-3 py-2.5 rounded-lg border border-outline-variant outline-none focus:border-secondary transition-colors"
                />
              </div>

              {/* Cadence Selector */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-label-code text-xs text-on-surface uppercase tracking-wider">
                    Interrogation Cadence
                  </label>
                  <span className="font-label-caps text-primary-container text-[10px]">60 MIN RECOMMENDED</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {cadenceOptions.map((opt) => (
                    <div
                      key={opt.value}
                      onClick={() => setInterval(opt.value)}
                      className={`cursor-pointer p-2.5 rounded-lg transition-all border flex flex-col gap-0.5 ${
                        interval === opt.value
                          ? "bg-surface-container-high border-primary-container text-on-surface shadow-sm"
                          : "bg-surface-container-lowest border-outline-variant/40 hover:bg-surface-container-high text-on-surface-variant"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-ticker-md text-xs font-semibold">{opt.title}</span>
                        {interval === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />}
                      </div>
                      <span className="font-label-caps text-[9px] text-outline">{opt.meta}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/40">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-lg bg-primary-container hover:bg-surface-tint text-on-primary-fixed text-xs font-semibold transition-all shadow-md disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">add_circle</span>
                  <span>{submitting ? "Engaging Radar..." : "Initiate Sweep"}</span>
                </button>
              </div>
            </form>
          ) : (
            /* BULK MODE */
            <form onSubmit={handleBulkSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-label-code text-xs text-on-surface uppercase tracking-wider">
                    Target Domain Stream
                  </label>
                  <span className="font-label-caps text-on-surface-variant text-[10px]">
                    ONE PER LINE OR COMMA-SEPARATED
                  </span>
                </div>
                <textarea
                  rows={5}
                  required
                  placeholder={`google.com\napple.com\ncloudflare.com`}
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  className="w-full bg-surface-container-lowest text-on-surface font-mono text-xs p-3 rounded-lg border border-outline-variant outline-none focus:border-secondary transition-colors resize-none leading-relaxed"
                />
              </div>

              {/* Cadence Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="font-label-code text-xs text-on-surface uppercase tracking-wider">
                  Default Cadence For Ingested Targets
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {cadenceOptions.map((opt) => (
                    <div
                      key={opt.value}
                      onClick={() => setInterval(opt.value)}
                      className={`cursor-pointer p-2.5 rounded-lg transition-all border flex flex-col gap-0.5 ${
                        interval === opt.value
                          ? "bg-surface-container-high border-primary-container text-on-surface shadow-sm"
                          : "bg-surface-container-lowest border-outline-variant/40 hover:bg-surface-container-high text-on-surface-variant"
                      }`}
                    >
                      <span className="font-ticker-md text-xs font-semibold">{opt.title}</span>
                      <span className="font-label-caps text-[9px] text-outline">{opt.meta}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/40">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-lg bg-primary-container hover:bg-surface-tint text-on-primary-fixed text-xs font-semibold transition-all shadow-md disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">upload_file</span>
                  <span>{submitting ? "Ingesting Stream..." : "Import Batch Stream"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
