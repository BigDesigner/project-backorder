import React, { useState, useMemo } from "react";
import { Event, fmtTime } from "../../lib/api";

interface ActivityViewProps {
  events: Event[];
}

export function ActivityView({ events }: ActivityViewProps) {
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || ev.message.toLowerCase().includes(q) || ev.type.toLowerCase().includes(q);
      if (!matchesSearch) return false;

      if (filterType === "all") return true;
      return ev.type.toLowerCase() === filterType.toLowerCase();
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

  function renderEventBadge(type: string) {
    const t = type.toLowerCase();
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
    if (t === "auth") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300 font-label-caps text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400" />
          AUTH
        </span>
      );
    }
    if (t === "error" || t === "rate_limited") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-error-container/30 text-error font-label-caps text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-error" />
          {type.toUpperCase()}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-caps text-[10px]">
        <span className="w-1.5 h-1.5 rounded-full bg-outline" />
        {type.toUpperCase()}
      </span>
    );
  }

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
            Immutable log of RDAP queries, status shifts, and access attempts
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[16px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/50 text-xs pl-8 pr-3 py-1.5 rounded-lg border border-outline-variant/60 focus:outline-none focus:border-secondary transition-colors"
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

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        {["all", "available", "registered", "auth", "error"].map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-3 py-1 rounded-md text-xs font-label-code uppercase transition-colors border ${
              filterType === t
                ? "bg-surface-container-high text-primary-container border-primary-container/40 font-bold"
                : "bg-surface-container-lowest text-on-surface-variant border-outline-variant/40 hover:text-on-surface"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Audit Log Container */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/60 overflow-hidden shadow-xl">
        {/* Table/List Header */}
        <div className="grid grid-cols-[130px_1fr_180px] gap-4 px-4 py-3 bg-surface-container-low border-b border-outline-variant/60 text-on-surface-variant font-label-caps">
          <div>Telemetry Type</div>
          <div>Event Payload / Message</div>
          <div className="text-right">Observed Timestamp</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-outline-variant/20 max-h-[65vh] overflow-y-auto">
          {filteredEvents.map((ev) => (
            <div
              key={ev.id}
              className="grid grid-cols-[130px_1fr_180px] gap-4 items-center px-4 py-3 hover:bg-surface-container-high/30 transition-colors"
            >
              <div>{renderEventBadge(ev.type)}</div>
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
              No telemetry events recorded for this selection.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
