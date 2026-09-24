import React, { useState } from "react";
import { Domain } from "../../lib/api";

interface DeleteDomainModalProps {
  domain: Domain | null;
  onClose: () => void;
  onConfirm: (d: Domain) => Promise<void>;
}

export function DeleteDomainModal({ domain, onClose, onConfirm }: DeleteDomainModalProps) {
  const [submitting, setSubmitting] = useState(false);

  if (!domain) return null;

  async function handleConfirm() {
    if (!domain || submitting) return;
    setSubmitting(true);
    try {
      await onConfirm(domain);
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-surface-container rounded-xl border border-error/30 p-6 shadow-2xl overflow-hidden">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 text-error">
            <div className="w-10 h-10 rounded-lg bg-error-container/30 border border-error/40 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">delete_forever</span>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-on-surface">Remove Target</h3>
              <p className="text-xs text-on-surface-variant font-label-code">TELEMETRY DE-REGISTRATION</p>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-surface-container-lowest border border-outline-variant/60 text-xs text-on-surface leading-relaxed">
            Are you sure you want to stop telemetry monitoring for{" "}
            <span className="font-mono font-bold text-primary-container">{domain.domain}</span>? All historical check
            metrics for this target will be removed.
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleConfirm}
              className="px-4 py-2 rounded-lg bg-error-container text-error hover:bg-error-container/80 text-xs font-semibold border border-error/40 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
              <span>{submitting ? "Removing..." : "Confirm Removal"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
