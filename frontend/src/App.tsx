import React, { useEffect, useMemo, useState } from "react";
import { api, Domain, Event } from "./lib/api";
import { ToastProvider, useToast } from "./components/Toast";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import { LoginView } from "./components/auth/LoginView";
import { StatCards } from "./components/dashboard/StatCards";
import { DomainTable } from "./components/dashboard/DomainTable";
import { AddDomainModal } from "./components/domains/AddDomainModal";
import { DeleteDomainModal } from "./components/domains/DeleteDomainModal";
import { ActivityView } from "./components/activity/ActivityView";
import { SettingsView } from "./components/settings/SettingsView";

function Shell() {
  const toast = useToast();

  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>("");

  const [domains, setDomains] = useState<Domain[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [now, setNow] = useState<number>(Math.floor(Date.now() / 1000));

  const [tab, setTab] = useState<"dashboard" | "activity" | "settings">("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "available" | "registered">("all");

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteModalDomain, setDeleteModalDomain] = useState<Domain | null>(null);

  async function refreshAll() {
    try {
      const d = await api.domains();
      setDomains(d.domains || []);
      setNow(d.now || Math.floor(Date.now() / 1000));

      const e = await api.events(250);
      setEvents(e.events || []);
    } catch (err: any) {
      if (err?.status === 401) {
        setAuthed(false);
      } else {
        console.error("Refresh failed:", err);
      }
    }
  }

  // Initial authentication check
  useEffect(() => {
    (async () => {
      try {
        await api.health();
        const me = await api.me();
        setUserEmail(me.user?.email || "admin@pulse.dev");
        setAuthed(true);
        await refreshAll();
      } catch {
        setAuthed(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Polling every 30s when authed
  useEffect(() => {
    if (!authed) return;
    const intervalId = setInterval(() => {
      refreshAll().catch(() => {});
    }, 30_000);
    return () => clearInterval(intervalId);
  }, [authed]);

  const stats = useMemo(() => {
    const safeDomains = domains || [];
    const total = safeDomains.length;
    const enabled = safeDomains.filter((d) => d.enabled === 1).length;
    const available = safeDomains.filter((d) => (d.last_status || "").toLowerCase() === "available").length;
    const rateLimited = safeDomains.filter((d) => (d.last_status || "").toLowerCase() === "rate_limited").length;
    const errors = safeDomains.filter((d) => (d.last_status || "").toLowerCase() === "error").length;
    return { total, enabled, available, rateLimited, errors };
  }, [domains]);

  async function doLogin(email: string, pass: string) {
    try {
      await api.login(email, pass);
      setAuthed(true);
      setUserEmail(email);
      toast.push("Session initialized. Telemetry active.");
      await refreshAll();
    } catch (e: any) {
      toast.push(e?.message || "Authentication failed");
      throw e;
    }
  }

  async function doLogout() {
    await api.logout().catch(() => {});
    setAuthed(false);
    setDomains([]);
    setEvents([]);
    toast.push("Session terminated.");
  }

  async function handleAddDomain(domain: string, label?: string, intervalMin?: number) {
    await api.addDomain(domain, label, intervalMin);
    toast.push(`Target "${domain}" registered.`);
    await refreshAll();
  }

  async function handleBulkAddDomains(domainList: string[], intervalMin?: number) {
    toast.push(`Ingesting ${domainList.length} targets...`);
    const res = await api.bulkAddDomains(domainList, intervalMin);
    toast.push(`Ingestion complete: ${res.results.added} added, ${res.results.skipped} skipped.`);
    await refreshAll();
  }

  async function handleToggleDomain(d: Domain) {
    try {
      const nextState = d.enabled !== 1;
      await api.patchDomain(d.id, { enabled: nextState });
      toast.push(nextState ? `Resumed sweep for ${d.domain}` : `Paused sweep for ${d.domain}`);
      await refreshAll();
    } catch (e: any) {
      toast.push(e?.message || "Failed to toggle target.");
    }
  }

  async function handleForceCheck(d: Domain) {
    try {
      await api.patchDomain(d.id, { forceCheck: true });
      toast.push(`Immediate sweep queued for ${d.domain}`);
      await refreshAll();
    } catch (e: any) {
      toast.push(e?.message || "Failed to queue sweep.");
    }
  }

  async function handleDeleteDomain(d: Domain) {
    try {
      await api.deleteDomain(d.id);
      toast.push(`De-registered ${d.domain}`);
      await refreshAll();
    } catch (e: any) {
      toast.push(`Error: ${e.message || "Failed to remove target"}`);
      throw e;
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 p-8 rounded-xl bg-surface-container border border-outline-variant/60 shadow-2xl">
          <div className="relative flex h-8 w-8">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-75" />
            <span className="relative inline-flex rounded-full h-8 w-8 bg-primary-container items-center justify-center">
              <span className="material-symbols-outlined text-on-primary-fixed text-[18px]">radar</span>
            </span>
          </div>
          <div className="text-sm font-semibold text-on-surface">Initializing DomainPulse Radar</div>
          <div className="text-xs text-on-surface-variant font-label-code">Connecting to Edge Worker API...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary-container selection:text-on-primary-fixed">
      {/* Top Header */}
      <Header
        tab={tab}
        setTab={setTab}
        onAddClick={() => setAddModalOpen(true)}
        onLogout={doLogout}
        authed={authed}
        userEmail={userEmail}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 lg:px-8 pt-24 pb-12 flex flex-col">
        {!authed ? (
          <LoginView onLogin={doLogin} loading={loading} />
        ) : (
          <div className="flex flex-col gap-8 w-full">
            {tab === "dashboard" && (
              <>
                {/* Metric Summary Cards */}
                <StatCards
                  stats={stats}
                  activeFilter={filterStatus}
                  onFilterChange={(f) => setFilterStatus(f)}
                />

                {/* Domain Watchlist Table */}
                <DomainTable
                  domains={domains}
                  now={now}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  filterStatus={filterStatus}
                  onFilterChange={setFilterStatus}
                  onToggle={handleToggleDomain}
                  onForceCheck={handleForceCheck}
                  onDelete={(d) => setDeleteModalDomain(d)}
                  onAddClick={() => setAddModalOpen(true)}
                />
              </>
            )}

            {tab === "activity" && <ActivityView events={events} />}

            {tab === "settings" && <SettingsView />}
          </div>
        )}
      </main>

      {/* Unified Global Footer */}
      <Footer />

      {/* Add Domain Modal (Single & Bulk) */}
      <AddDomainModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={handleAddDomain}
        onBulkAdd={handleBulkAddDomains}
      />

      {/* Constitution-Compliant Custom Delete Confirmation Modal */}
      <DeleteDomainModal
        domain={deleteModalDomain}
        onClose={() => setDeleteModalDomain(null)}
        onConfirm={handleDeleteDomain}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Shell />
    </ToastProvider>
  );
}
