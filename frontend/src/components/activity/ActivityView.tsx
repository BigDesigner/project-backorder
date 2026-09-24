import React, { useState, useMemo } from "react";
import { Event, fmtTime } from "../../lib/api";

interface ActivityViewProps {
  events: Event[];
}

type FilterCategory =
  | "all"
  | "available"
  | "registered"
  | "rate_limited"
  | "error"
  | "failed_auth"
  | "auth"
  | "system";

export function ActivityView({ events }: ActivityViewProps) {
  const [filterType, setFilterType] = useState<FilterCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const counts = useMemo(() => {
    return {
      all: events.length,
      available: events.filter((e) => e.type.toLowerCase() === "available").length,
      registered: events.filter((e) => e.type.toLowerCase() === "registered").length,
      rate_limited: events.filter((e) => e.type.toLowerCase() === "rate_limited").length,
      error: events.filter((e) => e.type.toLowerCase() === "error").length,
      failed_auth: events.filter(
        (e) => e.type.toLowerCase() === "auth" && e.message.toLowerCase().includes("fail")
      ).length,
      auth: events.filter((e) => e.type.toLowerCase() === "auth").length,
      system: events.filter((e) => e.type.toLowerCase() === "info").length,
    };
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || ev.message.toLowerCase().includes(q) || ev.type.toLowerCase().includes(q);
      if (!matchesSearch) return false;

      if (filterType === "all") return true;
      if (filterType === "available") return ev.type.toLowerCase() === "available";
      if (filterType === "registered") return ev.type.toLowerCase() === "registered";
      if (filterType === "rate_limited") return ev.type.toLowerCase() === "rate_limited";
      if (filterType === "error") return ev.type.toLowerCase() === "error";
      if (filterType === "failed_auth") {
        return ev.type.toLowerCase() === "auth" && ev.message.toLowerCase().includes("fail");
      }
      if (filterType === "auth") return ev.type.toLowerCase() === "auth";
      if (filterType === "system") return ev.type.toLowerCase() === "info";
      return true;
    });
  }, [events, filterType, searchQuery]);

  function exportJson() {
    const blob = new Blob([JSON.stringify(events, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `domainpulse-telemetry-events-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function renderEventBadge(ev: Event) {
    const t = ev.type.toLowerCase();
    const msg = ev.message.toLowerCase();

    if (t === "available") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary-container/20 text-primary-container font-label-caps text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse" />
          AVAILABLE
        </span>
      );
    }
    if (t === "registered") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-label-caps text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
          REGISTERED
        </span>
      );
    }
    if (t === "rate_limited") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-label-caps text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
          RATE LIMITED
        </span>
      );
    }
    if (t === "error") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-error-container/40 text-error font-label-caps text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-error" />
          ERROR
        </span>
      );
    }
    if (t === "auth") {
      if (msg.includes("fail")) {
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-label-caps text-[10px] border border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            AUTH FAILED
          </span>
        );
      }
      if (msg.includes("two-factor") || msg.includes("2fa")) {
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-label-caps text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            2FA EVENT
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300 font-label-caps text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400" />
          AUTH SUCCESS
        </span>
      );
    }
    if (t === "info") {
      if (msg.includes("scheduler")) {
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-caps text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-outline" />
            SCHEDULER
          </span>
        );
      }
      if (msg.includes("clean") || msg.includes("purge")) {
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-label-caps text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            MAINTENANCE
          </span>
        );
      }
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-caps text-[10px]">
        <span className="w-1.5 h-1.5 rounded-full bg-outline" />
        {ev.type.toUpperCase()}
      </span>
    );
  }

  const filterButtons: { id: FilterCategory; label: string; count: number; color?: string }[] = [
    { id: "all", label: "All Events", count: counts.all },
    { id: "available", label: "Available", count: counts.available, color: "text-primary-container" },
    { id: "registered", label: "Registered", count: counts.registered, color: "text-secondary" },
    { id: "rate_limited", label: "Rate Limited", count: counts.rate_limited, color: "text-amber-300" },
    { id: "error", label: "Errors", count: counts.error, color: "text-error" },
    { id: "failed_auth", label: "Failed Logins", count: counts.failed_auth, color: "text-rose-400" },
    { id: "auth", label: "All Auth", count: counts.auth, color: "text-fuchsia-300" },
    { id: "system", label: "System / Scheduler", count: counts.system, color: "text-on-surface-variant" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-on-surface">Telemetry Audit Stream</h2>
            <span className="font-label-caps px-2 py-0.5 rounded bg-surface-container-high text-secondary border border-outline-variant text-[10px]">
              LIVE INGESTION
            </span>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            Immutable log of RDAP queries, status shifts, failed attempts, and system ticks
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative min-w-[240px] flex-1 sm:flex-initial">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] pointer-events-none select-none">
              search
            </span>
            <input
              type="text"
              placeholder="Search logs or IPs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/50 text-xs pl-10 pr-3 py-2 rounded-lg border border-outline-variant/60 focus:outline-none focus:border-secondary transition-colors"
            />
          </div>

          <button
            onClick={exportJson}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant text-xs text-on-surface transition-colors font-medium"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Comprehensive Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        {filterButtons.map((btn) => (
          <button
            key={btn.id}
            onClick={() => setFilterType(btn.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border flex items-center gap-1.5 ${
              filterType === btn.id
                ? "bg-surface-container-high text-on-surface border-primary-container shadow-sm font-semibold"
                : "bg-surface-container-lowest text-on-surface-variant border-outline-variant/40 hover:bg-surface-container-high hover:text-on-surface"
            }`}
          >
            <span>{btn.label}</span>
            <span
              className={`font-label-code text-[11px] px-1.5 py-0.2 rounded ${
                filterType === btn.id
                  ? "bg-surface-container-highest text-primary-container font-bold"
                  : "bg-surface-container text-on-surface-variant"
              }`}
            >
              {btn.count}
            </span>
          </button>
        ))}
      </div>

      {/* Audit Log Container */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/60 overflow-hidden shadow-xl">
        {/* Table/List Header */}
        <div className="grid grid-cols-[140px_1fr_180px] gap-4 px-4 py-3 bg-surface-container-low border-b border-outline-variant/60 text-on-surface-variant font-label-caps">
          <div>Telemetry Type</div>
          <div>Event Payload / Message</div>
          <div className="text-right">Observed Timestamp</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-outline-variant/20 max-h-[65vh] overflow-y-auto">
          {filteredEvents.map((ev) => (
            <div
              key={ev.id}
              className="grid grid-cols-[140px_1fr_180px] gap-4 items-center px-4 py-3 hover:bg-surface-container-high/30 transition-colors"
            >
              <div>{renderEventBadge(ev)}</div>
              <div className="text-xs text-on-surface font-mono truncate" title={ev.message}>
                {ev.message}
              </div>
              <div className="text-right font-label-code text-[11px] text-on-surface-variant">
                {fmtTime(ev.created_at)}
              </div>
            </div>
          ))}

          {filteredEvents.length === 0 && (
            <div className="py-12 text-center text-xs text-on-surface-variant">
              No telemetry events recorded for this filter category.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
