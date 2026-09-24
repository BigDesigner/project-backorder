import React from "react";

interface HeaderProps {
  tab: "dashboard" | "activity" | "settings";
  setTab: (tab: "dashboard" | "activity" | "settings") => void;
  onAddClick: () => void;
  onLogout: () => void;
  authed: boolean;
  userEmail?: string;
}

export function Header({ tab, setTab, onAddClick, onLogout, authed, userEmail }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-md border-b border-outline-variant">
      <div className="h-16 w-full px-4 lg:px-8 flex items-center justify-between gap-4">
        {/* Brand & Monogram */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setTab("dashboard")}>
            <div className="w-2.5 h-2.5 rounded-full bg-primary-container shadow-[0_0_8px_#00f5a0]" />
            <span className="font-semibold text-xl tracking-tight text-on-surface">DomainPulse</span>
            <span className="font-label-caps px-1.5 py-0.5 rounded bg-surface-container-high text-primary-container border border-outline-variant text-[10px]">
              v2.0
            </span>
          </div>

          {/* Navigation Links */}
          {authed && (
            <nav className="hidden md:flex items-center gap-6 pt-1">
              <button
                onClick={() => setTab("dashboard")}
                className={`transition-colors pb-[20px] font-medium text-sm flex items-center gap-1.5 ${
                  tab === "dashboard"
                    ? "text-on-surface border-b-2 border-primary-container"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">radar</span>
                Dashboard
              </button>
              <button
                onClick={() => setTab("activity")}
                className={`transition-colors pb-[20px] font-medium text-sm flex items-center gap-1.5 ${
                  tab === "activity"
                    ? "text-on-surface border-b-2 border-primary-container"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">history</span>
                Activity
              </button>
              <button
                onClick={() => setTab("settings")}
                className={`transition-colors pb-[20px] font-medium text-sm flex items-center gap-1.5 ${
                  tab === "settings"
                    ? "text-on-surface border-b-2 border-primary-container"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">tune</span>
                Settings
              </button>
            </nav>
          )}
        </div>

        {/* Actions & User Identity */}
        {authed && (
          <div className="flex items-center gap-3">
            <button
              onClick={onAddClick}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-primary-container text-on-primary-fixed text-xs font-semibold hover:bg-surface-tint transition-all shadow-sm active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Add Target</span>
            </button>

            <div className="flex items-center gap-2 pl-3 border-l border-outline-variant">
              <span className="hidden xl:inline text-on-surface-variant font-label-code text-xs">
                {userEmail || "admin@pulse.dev"}
              </span>
              <button
                onClick={onLogout}
                title="Sign out"
                className="w-8 h-8 rounded bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-error transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
