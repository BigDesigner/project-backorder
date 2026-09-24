import React from "react";

interface StatCardsProps {
  stats: {
    total: number;
    enabled: number;
    available: number;
    rateLimited: number;
    errors: number;
  };
  activeFilter: "all" | "available" | "registered";
  onFilterChange: (filter: "all" | "available" | "registered") => void;
}

export function StatCards({ stats, activeFilter, onFilterChange }: StatCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Domains */}
      <div
        onClick={() => onFilterChange("all")}
        className={`p-5 rounded-xl cursor-pointer transition-all border ${
          activeFilter === "all"
            ? "bg-surface-container-high border-secondary shadow-sm"
            : "bg-surface-container-low border-outline-variant/60 hover:border-outline-variant"
        } flex flex-col justify-between`}
      >
        <div className="flex items-center justify-between">
          <span className="font-label-caps text-on-surface-variant">TOTAL TARGETS</span>
          <span className="material-symbols-outlined text-on-surface-variant text-[20px]">public</span>
        </div>
        <div className="mt-4">
          <span className="font-ticker-lg text-3xl text-on-surface font-bold">{stats.total}</span>
          <p className="text-xs text-on-surface-variant mt-1">Telemetry targets configured</p>
        </div>
      </div>

      {/* 2. Enabled */}
      <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/60 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-label-caps text-on-surface-variant">ENABLED SWEEPS</span>
          <span className="material-symbols-outlined text-secondary text-[20px]">sync</span>
        </div>
        <div className="mt-4">
          <span className="font-ticker-lg text-3xl text-on-surface font-bold">{stats.enabled}</span>
          <p className="text-xs text-on-surface-variant mt-1">Autonomous checks scheduled</p>
        </div>
      </div>

      {/* 3. Available to Grab (HERO CARD) */}
      <div
        onClick={() => onFilterChange("available")}
        className={`p-5 rounded-xl cursor-pointer transition-all border relative overflow-hidden flex flex-col justify-between ${
          stats.available > 0
            ? "bg-surface-container-high border-primary-container shadow-[0_0_24px_rgba(0,245,160,0.15)] ring-1 ring-primary-container/40"
            : activeFilter === "available"
            ? "bg-surface-container-high border-primary-container"
            : "bg-surface-container-low border-outline-variant/60 hover:border-outline-variant"
        }`}
      >
        {/* Glow backdrop */}
        <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-primary-container/15 blur-xl pointer-events-none" />

        <div className="flex items-center justify-between relative z-10">
          <span className="font-label-caps text-primary-container flex items-center gap-1.5">
            {stats.available > 0 && <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-ping" />}
            AVAILABLE TO GRAB
          </span>
          <span className="material-symbols-outlined text-primary-container text-[20px]">verified</span>
        </div>

        <div className="mt-4 relative z-10">
          <div className="flex items-baseline gap-2">
            <span className="font-ticker-lg text-3xl text-primary-container font-bold">{stats.available}</span>
            {stats.available > 0 && (
              <span className="font-label-caps px-2 py-0.5 rounded bg-primary-container/20 text-primary-container font-bold">
                ACTION READY
              </span>
            )}
          </div>
          <p className="text-xs text-on-surface mt-1 font-medium">
            {stats.available > 0 ? "Ready to register right now!" : "No dropped domains right now"}
          </p>
        </div>
      </div>

      {/* 4. Rate Limited / Errors */}
      <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/60 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-label-caps text-on-surface-variant">RATE LIMITS / ERRORS</span>
          <span
            className={`material-symbols-outlined text-[20px] ${
              stats.rateLimited > 0 || stats.errors > 0 ? "text-error" : "text-primary-fixed-dim"
            }`}
          >
            health_and_safety
          </span>
        </div>
        <div className="mt-4">
          <div className="flex items-baseline gap-2">
            <span
              className={`font-ticker-lg text-3xl font-bold ${
                stats.rateLimited > 0 || stats.errors > 0 ? "text-error" : "text-on-surface"
              }`}
            >
              {stats.rateLimited + stats.errors}
            </span>
            {(stats.rateLimited > 0 || stats.errors > 0) && (
              <span className="font-label-caps px-1.5 py-0.5 rounded bg-error-container/30 text-error">
                {stats.rateLimited} RL / {stats.errors} ERR
              </span>
            )}
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            {stats.rateLimited === 0 && stats.errors === 0
              ? "All telemetry sweeps 100% healthy"
              : "Backoff delay applied automatically"}
          </p>
        </div>
      </div>
    </div>
  );
}
