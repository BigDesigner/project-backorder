import React from "react";

export function Footer() {
  return (
    <footer className="py-8 px-4 border-t border-outline-variant/30 text-center text-xs text-on-surface-variant flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto w-full mt-auto gap-3">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
        <span>DomainPulse • Built for always-free serverless operations</span>
      </div>

      <div className="flex items-center gap-4 text-on-surface-variant font-label-code text-[11px]">
        <span>Cloudflare Worker + D1 SQLite</span>
        <span>•</span>
        <a
          href="https://github.com/BigDesigner/project-backorder"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-primary-container transition-colors inline-flex items-center gap-1"
        >
          <span>GitHub</span>
          <span className="material-symbols-outlined text-[14px]">open_in_new</span>
        </a>
      </div>
    </footer>
  );
}
