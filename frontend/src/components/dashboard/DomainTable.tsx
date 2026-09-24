import React, { useMemo } from "react";
import { Domain, fmtTime, relEta } from "../../lib/api";

interface DomainTableProps {
  domains: Domain[];
  now: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterStatus: "all" | "available" | "registered";
  onFilterChange: (status: "all" | "available" | "registered") => void;
  onToggle: (d: Domain) => void;
  onForceCheck: (d: Domain) => void;
  onDelete: (d: Domain) => void;
  onChangeInterval?: (d: Domain, intervalMin: number) => void;
  onAddClick: () => void;
}

export function DomainTable({
  domains,
  now,
  searchQuery,
  onSearchChange,
  filterStatus,
  onFilterChange,
  onToggle,
  onForceCheck,
  onDelete,
  onChangeInterval,
  onAddClick,
}: DomainTableProps) {
  // Filter domains based on search query and status filter
  const filteredDomains = useMemo(() => {
    return domains.filter((d) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        d.domain.toLowerCase().includes(q) ||
        (d.label && d.label.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      const status = (d.last_status || "unknown").toLowerCase();
      if (filterStatus === "available") {
        return status === "available";
      }
      if (filterStatus === "registered") {
        return status === "registered";
      }
      return true;
    });
  }, [domains, searchQuery, filterStatus]);

  const availableCount = useMemo(
    () => domains.filter((d) => (d.last_status || "").toLowerCase() === "available").length,
    [domains]
  );
  const registeredCount = useMemo(
    () => domains.filter((d) => (d.last_status || "").toLowerCase() === "registered").length,
    [domains]
  );

  function formatIntervalLabel(m: number): string {
    if (m === 30) return "30 min";
    if (m === 60) return "60 min";
    if (m === 120) return "2 hours";
    if (m === 240) return "4 hours";
    if (m === 360) return "6 hours";
    if (m === 720) return "12 hours";
    if (m === 1440) return "24 hours";
    if (m < 60) return `${m} min`;
    const h = m / 60;
    return Number.isInteger(h) ? `${h} hours` : `${m} min`;
  }

  function getCadenceBadge(min: number) {
    if (min <= 30) {
      return { label: `${min} min`, meta: "High Cadence", color: "text-secondary" };
    }
    if (min <= 120) {
      return { label: `${min} min`, meta: "Optimal", color: "text-primary-container" };
    }
    return { label: `${min} min`, meta: "Eco Passive", color: "text-outline" };
  }

  function renderStatusPill(d: Domain) {
    const s = (d.last_status || "unknown").toLowerCase();

    if (s === "available") {
      return (
        <div className="inline-flex flex-col gap-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-primary-container/20 text-primary-container font-label-caps uppercase font-bold w-fit shadow-[0_0_12px_rgba(0,245,160,0.2)]">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse" />
            Available
          </span>
          <span className="font-label-code text-[11px] text-primary-container/80">
            {d.last_rdap_http ? `HTTP ${d.last_rdap_http} • Dropped` : "Free to register"}
          </span>
        </div>
      );
    }

    if (s === "registered") {
      return (
        <div className="inline-flex flex-col gap-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-high text-on-surface font-label-caps uppercase font-medium w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
            Registered
          </span>
          <span className="font-label-code text-[11px] text-on-surface-variant">
            {d.last_rdap_http ? `HTTP ${d.last_rdap_http}` : "Active"}
          </span>
        </div>
      );
    }

    if (s === "rate_limited") {
      return (
        <div className="inline-flex flex-col gap-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 font-label-caps uppercase font-bold w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            Rate Limited
          </span>
          <span className="font-label-code text-[11px] text-amber-200/70">HTTP 429 • Backing off</span>
        </div>
      );
    }

    if (s === "error") {
      return (
        <div className="inline-flex flex-col gap-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-error-container/30 text-error font-label-caps uppercase font-bold w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-error" />
            Error
          </span>
          <span className="font-label-code text-[11px] text-error/80 max-w-[140px] truncate" title={d.last_error || "Check failed"}>
            {d.last_error || "Check failed"}
          </span>
        </div>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container text-on-surface-variant font-label-caps uppercase w-fit">
        <span className="w-1.5 h-1.5 rounded-full bg-outline" />
        Pending Sweep
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Title & Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Title & Status */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-bold tracking-tight text-on-surface">Telemetry Watchlist</h2>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-container-high border border-outline-variant">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-container" />
              </span>
              <span className="font-label-caps text-primary-container">LIVE SWEEPS</span>
            </div>
          </div>
          <p className="text-xs text-on-surface-variant flex items-center gap-2">
            <span>Real-time registry RDAP monitoring</span>
            <span className="inline-block w-1 h-1 rounded-full bg-outline" />
            <span>Auto-refreshing every 30s</span>
          </p>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative min-w-[240px] flex-1 sm:flex-initial">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] pointer-events-none select-none">
              search
            </span>
            <input
              type="text"
              placeholder="Search domains or labels..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/50 text-xs pl-10 pr-3 py-2 rounded-lg border border-outline-variant/60 focus:outline-none focus:border-secondary transition-colors"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center p-1 rounded-lg bg-surface-container-lowest border border-outline-variant/60">
            <button
              onClick={() => onFilterChange("all")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filterStatus === "all"
                  ? "bg-surface-container-high text-on-surface shadow-sm font-semibold"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              All <span className="font-label-code ml-1 text-on-surface-variant">{domains.length}</span>
            </button>
            <button
              onClick={() => onFilterChange("available")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filterStatus === "available"
                  ? "bg-surface-container-high text-primary-container shadow-sm font-semibold"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Available <span className="font-label-code ml-1 text-primary-container font-bold">{availableCount}</span>
            </button>
            <button
              onClick={() => onFilterChange("registered")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filterStatus === "registered"
                  ? "bg-surface-container-high text-on-surface shadow-sm font-semibold"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Registered <span className="font-label-code ml-1 text-on-surface-variant">{registeredCount}</span>
            </button>
          </div>

          <button
            onClick={onAddClick}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary-container hover:bg-surface-tint text-on-primary-fixed text-xs font-semibold transition-all shadow-sm active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Add Target</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex flex-col rounded-xl bg-surface-container-lowest border border-outline-variant/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant font-label-caps border-b border-outline-variant/60">
                <th className="py-3.5 px-4 font-semibold">Target Domain</th>
                <th className="py-3.5 px-4 font-semibold">Telemetry Status</th>
                <th className="py-3.5 px-4 font-semibold">Next Sweep</th>
                <th className="py-3.5 px-4 font-semibold">Cadence</th>
                <th className="py-3.5 px-4 font-semibold">Registry Expiry</th>
                <th className="py-3.5 px-4 font-semibold">Last Checked</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {filteredDomains.map((d) => {
                const cadence = getCadenceBadge(d.check_interval_min);
                const isAvailable = (d.last_status || "").toLowerCase() === "available";
                const isExpiringSoon = d.expires_at && d.expires_at - now < 86400 * 30 && d.expires_at > now;
                const isExpired = d.expires_at && d.expires_at <= now;

                return (
                  <tr
                    key={d.id}
                    className={`hover:bg-surface-container-high/40 transition-colors ${
                      isAvailable ? "bg-primary-container/5" : ""
                    }`}
                  >
                    {/* Domain & Label */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                            isAvailable
                              ? "bg-primary-container/20 border-primary-container/40 text-primary-container shadow-[0_0_12px_rgba(0,245,160,0.2)]"
                              : "bg-surface-container-high border-outline-variant/40 text-on-surface-variant"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {isAvailable ? "bolt" : "language"}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-on-surface tracking-tight font-mono">
                              {d.domain}
                            </span>
                            {d.label && (
                              <span className="font-label-caps px-1.5 py-0.2 rounded bg-surface-container-high text-on-surface-variant border border-outline-variant/40 text-[9px]">
                                {d.label}
                              </span>
                            )}
                          </div>
                          <span className="block font-label-code text-[11px] text-on-surface-variant/70">
                            rdap://{d.domain.split(".").pop()}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">{renderStatusPill(d)}</td>

                    {/* Next Check */}
                    <td className="py-4 px-4">
                      <span className="font-ticker-md text-sm text-on-surface font-semibold">
                        {relEta(d.next_check_at, now)}
                      </span>
                      <span className="block text-[11px] text-on-surface-variant font-label-code">
                        {fmtTime(d.next_check_at).split(" ")[1] || "—"}
                      </span>
                    </td>

                    {/* Cadence / Interval */}
                    <td className="py-4 px-4">
                      {(() => {
                        const INTERVAL_OPTIONS = [30, 60, 120, 240, 360, 720, 1440];
                        const opts = INTERVAL_OPTIONS.includes(d.check_interval_min)
                          ? INTERVAL_OPTIONS
                          : [...INTERVAL_OPTIONS, d.check_interval_min].sort((a, b) => a - b);

                        return (
                          <div className="flex flex-col gap-1">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/60 focus-within:border-secondary transition-all w-fit">
                              <span
                                className={`material-symbols-outlined text-[15px] shrink-0 select-none ${cadence.color}`}
                              >
                                speed
                              </span>
                              <select
                                value={d.check_interval_min}
                                onChange={(e) => onChangeInterval?.(d, parseInt(e.target.value, 10))}
                                className="bg-transparent text-on-surface font-label-code text-[11px] outline-none cursor-pointer pr-1"
                                title="Click to change sweep cadence interval"
                              >
                                {opts.map((opt) => (
                                  <option key={opt} value={opt} className="bg-surface-container-lowest text-on-surface">
                                    {formatIntervalLabel(opt)}
                                  </option>
                                ))}
                              </select>
                              <span className="material-symbols-outlined text-[14px] text-on-surface-variant pointer-events-none select-none shrink-0">
                                expand_more
                              </span>
                            </div>
                            <span className={`block text-[10px] font-label-caps ${cadence.color}`}>
                              {cadence.meta}
                            </span>
                          </div>
                        );
                      })()}
                    </td>

                    {/* Expiry Date */}
                    <td className="py-4 px-4">
                      {d.expires_at ? (
                        <div>
                          <span
                            className={`font-ticker-md text-sm font-semibold ${
                              isAvailable || isExpired
                                ? "text-primary-container"
                                : isExpiringSoon
                                ? "text-error"
                                : "text-on-surface"
                            }`}
                          >
                            {fmtTime(d.expires_at).split(" ")[0]}
                          </span>
                          <span
                            className={`block text-[11px] font-label-code ${
                              isAvailable || isExpired
                                ? "text-primary-container/80 font-bold"
                                : isExpiringSoon
                                ? "text-error font-medium"
                                : "text-on-surface-variant"
                            }`}
                          >
                            {isAvailable || isExpired
                              ? "EXPIRED / DROPPED"
                              : `${Math.ceil((d.expires_at - now) / 86400)} days left`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-on-surface-variant font-label-code text-xs">—</span>
                      )}
                    </td>

                    {/* Last Check */}
                    <td className="py-4 px-4">
                      <span className="text-xs text-on-surface font-medium font-mono">
                        {d.last_checked_at ? fmtTime(d.last_checked_at).split(" ")[1] : "Never"}
                      </span>
                      <span className="block font-label-code text-[10px] text-on-surface-variant">
                        {d.last_checked_at ? fmtTime(d.last_checked_at).split(" ")[0] : "—"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        {/* Direct Register Link for Available Domains */}
                        {isAvailable && (
                          <a
                            href={`https://www.google.com/search?q=register+domain+${encodeURIComponent(d.domain)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Register domain now"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-primary-container text-on-primary-fixed text-xs font-bold hover:bg-surface-tint transition-all shadow-sm"
                          >
                            <span className="material-symbols-outlined text-[16px]">shopping_cart</span>
                            <span>Grab</span>
                          </a>
                        )}

                        {/* Force Immediate Check */}
                        <button
                          onClick={() => onForceCheck(d)}
                          title="Force Sweep Now"
                          className="w-8 h-8 rounded bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/60 text-on-surface-variant hover:text-secondary flex items-center justify-center transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">refresh</span>
                        </button>

                        {/* Toggle Active/Pause */}
                        <button
                          onClick={() => onToggle(d)}
                          title={d.enabled === 1 ? "Pause Sweep" : "Resume Sweep"}
                          className={`w-8 h-8 rounded border border-outline-variant/60 flex items-center justify-center transition-colors ${
                            d.enabled === 1
                              ? "bg-surface-container-high text-on-surface-variant hover:text-amber-400"
                              : "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {d.enabled === 1 ? "pause" : "play_arrow"}
                          </span>
                        </button>

                        {/* Delete Domain */}
                        <button
                          onClick={() => onDelete(d)}
                          title="Remove Target"
                          className="w-8 h-8 rounded bg-surface-container-high hover:bg-error-container/30 border border-outline-variant/60 text-on-surface-variant hover:text-error flex items-center justify-center transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredDomains.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 px-4 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-outline text-[32px]">radar</span>
                      <p className="text-sm text-on-surface-variant font-medium">
                        {searchQuery ? "No targets match your query." : "No domain targets registered yet."}
                      </p>
                      <button
                        onClick={onAddClick}
                        className="mt-2 text-xs font-semibold text-primary-container hover:underline inline-flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        <span>Add your first domain target</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
