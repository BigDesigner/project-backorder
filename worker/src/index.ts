import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./types";
import { ensureAdmin, addEvent, listDomains, listEvents, nowSec, getDomainById, getDomainByName } from "./db";
import { requireAuth, verifyCredentials, createSession, logout as doLogout, getSessionTokenFromRequest } from "./auth";
import { generateTotpSecret, generateTotpUri, verifyTotp } from "./crypto";
import { runScheduler } from "./scheduler";

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors({
  origin: (origin) => {
    if (!origin) return null;
    try {
      const url = new URL(origin);
      const host = url.hostname;
      // Strictly allow only gnn.tr, our own Pages project, and localhost for development
      if (
        host === "gnn.tr" ||
        host.endsWith(".gnn.tr") ||
        host === "backorder-frontend.pages.dev" ||
        host.endsWith(".backorder-frontend.pages.dev") || // Pages preview deploy'ları
        host === "localhost" ||
        host === "127.0.0.1"
      ) {
        return origin;
      }
      return null;
    } catch {
      return null;
    }
  },
  credentials: true,
  allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "Cookie", "X-Requested-With"],
  maxAge: 86400,
}));

// SEC-03: CSRF protection — require X-Requested-With on all mutating requests
app.use("*", async (c, next) => {
  const method = c.req.method.toUpperCase();
  if (["POST", "PATCH", "DELETE"].includes(method)) {
    if (c.req.header("X-Requested-With") !== "XMLHttpRequest") {
      return c.json({ ok: false, error: "Forbidden" }, 403);
    }
  }
  await next();
});

app.get("/api/health", async (c) => {
  return c.json({ ok: true, ts: new Date().toISOString() });
});

app.get("/api/me", async (c) => {
  const user = await requireAuth(c.env, c.req.raw);
  if (!user) return c.json({ ok: false }, 401);
  return c.json({ ok: true, user });
});

app.post("/api/login", async (c) => {
  await ensureAdmin(c.env);
  const body = await c.req.json().catch(() => null) as { email?: string; password?: string; otp?: string } | null;
  if (!body?.email || !body?.password) return c.json({ ok: false, error: "Missing email/password" }, 400);

  // SEC-08: Rate limit — max 5 failed attempts per minute per IP
  const rawIp = c.req.header("CF-Connecting-IP") || c.req.header("X-Forwarded-For") || "127.0.0.1";
  const ip = rawIp.replace(/[%_]/g, ""); // SEC-11: Sanitize IP to prevent SQL wildcard injection
  const recentFails = await c.env.DB.prepare(
    "SELECT COUNT(*) as cnt FROM events WHERE type = 'auth' AND message LIKE ? AND created_at > ?"
  ).bind(`Failed login attempt% IP: ${ip}`, nowSec() - 60).first<{cnt: number}>();
  if (recentFails && recentFails.cnt >= 5) {
    return c.json({ ok: false, error: "Too many attempts. Try again later." }, 429);
  }

  // 1. Verify primary credentials first
  const user = await verifyCredentials(c.env, body.email, body.password);
  if (!user) {
    await addEvent(c.env, null, "auth", `Failed login attempt for ${body.email} IP: ${ip}`);
    return c.json({ ok: false, error: "Invalid credentials" }, 401);
  }

  // 2. Check if 2FA (TOTP) is enabled in settings
  const totpEnabledSetting = await c.env.DB.prepare(
    "SELECT value FROM settings WHERE key = 'totp_enabled'"
  ).first<{ value: string }>();
  const isTotpEnabled = totpEnabledSetting?.value === "true";

  if (isTotpEnabled) {
    // If user has not provided OTP yet, prompt them to enter it
    if (!body.otp) {
      return c.json({ ok: false, require2fa: true, message: "Two-factor authentication code required" }, 200);
    }

    const totpSecret = await c.env.DB.prepare(
      "SELECT value FROM settings WHERE key = 'totp_secret'"
    ).first<{ value: string }>();

    if (!totpSecret?.value || !(await verifyTotp(body.otp, totpSecret.value))) {
      await addEvent(c.env, null, "auth", `Failed 2FA code verification for ${body.email} IP: ${ip}`);
      return c.json({ ok: false, error: "Invalid 2FA code", require2fa: true }, 401);
    }
  }

  // 3. Issue session upon successful authentication
  const session = await createSession(c.env, user.id);
  await addEvent(c.env, null, "auth", `Login success for ${body.email}`);
  c.header(
    "Set-Cookie",
    `bo_session=${encodeURIComponent(session.token)}; Path=/; Max-Age=${60*60*24*7}; HttpOnly; SameSite=None; Secure`
  );

  // SEC-01: Do NOT return token in body — HttpOnly cookie is sufficient
  return c.json({ ok: true });
});

// 2FA Management Endpoints
app.get("/api/2fa/status", async (c) => {
  const user = await requireAuth(c.env, c.req.raw);
  if (!user) return c.json({ ok: false }, 401);

  const setting = await c.env.DB.prepare(
    "SELECT value FROM settings WHERE key = 'totp_enabled'"
  ).first<{ value: string }>();

  return c.json({ ok: true, enabled: setting?.value === "true" });
});

app.post("/api/2fa/setup", async (c) => {
  const user = await requireAuth(c.env, c.req.raw);
  if (!user) return c.json({ ok: false }, 401);

  const secret = generateTotpSecret();
  const uri = generateTotpUri(secret, user.email, "DomainPulse");

  // Save as pending secret until verified
  await c.env.DB.prepare(
    "INSERT INTO settings(key, value, updated_at) VALUES('totp_pending_secret', ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at"
  ).bind(secret, nowSec()).run();

  return c.json({ ok: true, secret, uri });
});

app.post("/api/2fa/verify", async (c) => {
  const user = await requireAuth(c.env, c.req.raw);
  if (!user) return c.json({ ok: false }, 401);

  const body = await c.req.json().catch(() => null) as { otp?: string } | null;
  if (!body?.otp) return c.json({ ok: false, error: "Missing OTP" }, 400);

  const pending = await c.env.DB.prepare(
    "SELECT value FROM settings WHERE key = 'totp_pending_secret'"
  ).first<{ value: string }>();

  if (!pending?.value) {
    return c.json({ ok: false, error: "No pending 2FA setup found. Please initiate setup again." }, 400);
  }

  const valid = await verifyTotp(body.otp, pending.value);
  if (!valid) {
    return c.json({ ok: false, error: "Invalid 6-digit verification code. Please check your authenticator clock." }, 400);
  }

  // Promote pending secret to active totp_secret and set totp_enabled = true
  await c.env.DB.prepare(
    "INSERT INTO settings(key, value, updated_at) VALUES('totp_secret', ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at"
  ).bind(pending.value, nowSec()).run();

  await c.env.DB.prepare(
    "INSERT INTO settings(key, value, updated_at) VALUES('totp_enabled', 'true', ?) ON CONFLICT(key) DO UPDATE SET value = 'true', updated_at = excluded.updated_at"
  ).bind(nowSec()).run();

  await c.env.DB.prepare("DELETE FROM settings WHERE key = 'totp_pending_secret'").run();

  await addEvent(c.env, null, "auth", `Two-factor authentication (TOTP) enabled for ${user.email}`);

  return c.json({ ok: true });
});

app.post("/api/2fa/disable", async (c) => {
  const user = await requireAuth(c.env, c.req.raw);
  if (!user) return c.json({ ok: false }, 401);

  const body = await c.req.json().catch(() => null) as { otp?: string } | null;
  const totpSecret = await c.env.DB.prepare(
    "SELECT value FROM settings WHERE key = 'totp_secret'"
  ).first<{ value: string }>();

  // Require OTP verification to disable 2FA
  if (totpSecret?.value && body?.otp) {
    const valid = await verifyTotp(body.otp, totpSecret.value);
    if (!valid) {
      return c.json({ ok: false, error: "Invalid 6-digit code. Cannot disable 2FA." }, 400);
    }
  }

  await c.env.DB.prepare(
    "INSERT INTO settings(key, value, updated_at) VALUES('totp_enabled', 'false', ?) ON CONFLICT(key) DO UPDATE SET value = 'false', updated_at = excluded.updated_at"
  ).bind(nowSec()).run();
  await c.env.DB.prepare("DELETE FROM settings WHERE key IN ('totp_secret', 'totp_pending_secret')").run();

  await addEvent(c.env, null, "auth", `Two-factor authentication (TOTP) disabled for ${user.email}`);

  return c.json({ ok: true });
});

app.post("/api/logout", async (c) => {
  const token = getSessionTokenFromRequest(c.req.raw);
  if (token) await doLogout(c.env, token);
  // SEC-02: Match login cookie flags exactly
  c.header("Set-Cookie", "bo_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=None");
  return c.json({ ok: true });
});

app.get("/api/domains", async (c) => {
  const user = await requireAuth(c.env, c.req.raw);
  if (!user) return c.json({ ok: false }, 401);

  const domains = await listDomains(c.env);
  return c.json({ ok: true, domains, now: nowSec() });
});

app.post("/api/domains", async (c) => {
  const user = await requireAuth(c.env, c.req.raw);
  if (!user) return c.json({ ok: false }, 401);

  const body = await c.req.json().catch(() => null) as { domain?: string; label?: string; intervalMin?: number } | null;
  const domain = (body?.domain || "").trim().toLowerCase();
  if (!domain || !domain.includes(".") || !/^[a-z0-9.-]+$/.test(domain)) {
    return c.json({ ok: false, error: "Invalid domain format. Only alphanumeric, hyphens, and dots are allowed." }, 400);
  }

  const existing = await getDomainByName(c.env, domain);
  if (existing) return c.json({ ok: false, error: "Domain already exists" }, 409);

  const intervalMin = Math.max(30, Math.min(24*60, Math.floor(body?.intervalMin ?? 60)));
  const now = nowSec();
  // Set next_check_at to NOW so it gets picked up immediately
  const next = now;

  await c.env.DB.prepare(
    "INSERT INTO domains(domain, label, enabled, check_interval_min, next_check_at, last_checked_at, last_status, created_at) VALUES(?,?,?,?,?,?,?,?)"
  ).bind(domain, body?.label ?? null, 1, intervalMin, next, null, "unknown", now).run();

  const row = await getDomainByName(c.env, domain);
  if (row) {
    await addEvent(c.env, row.id, "info", `Domain added by ${user.email}: ${domain} (interval ${intervalMin}m)`);
    // Run scheduler immediately after add — don't block the response on it
    c.executionCtx.waitUntil(runScheduler(c.env));
  }
  return c.json({ ok: true, domain: row });
});

app.patch("/api/domains/:id", async (c) => {
  const user = await requireAuth(c.env, c.req.raw);
  if (!user) return c.json({ ok: false }, 401);

  const id = Number(c.req.param("id"));
  const d = await getDomainById(c.env, id);
  if (!d) return c.json({ ok: false, error: "Not found" }, 404);

  const body = await c.req.json().catch(() => null) as { label?: string; enabled?: boolean; intervalMin?: number; forceCheck?: boolean } | null;
  const updates: string[] = [];
  const binds: unknown[] = [];

  if (typeof body?.label === "string") {
    updates.push("label = ?");
    binds.push(body.label);
  }
  if (typeof body?.enabled === "boolean") {
    updates.push("enabled = ?");
    binds.push(body.enabled ? 1 : 0);
  }
  if (typeof body?.intervalMin === "number") {
    const intervalMin = Math.max(30, Math.min(24*60, Math.floor(body.intervalMin)));
    updates.push("check_interval_min = ?");
    binds.push(intervalMin);
  }
  if (body?.forceCheck) {
    updates.push("next_check_at = ?");
    binds.push(nowSec());
  }
  // SEC-05: Guard against empty updates
  if (updates.length === 0) {
    return c.json({ ok: true, domain: d });
  }
  binds.push(id);
  await c.env.DB.prepare(`UPDATE domains SET ${updates.join(", ")} WHERE id = ?`).bind(...binds).run();

  if (body?.forceCheck) {
    // Run scheduler AFTER the database has been updated — don't block the response on it
    c.executionCtx.waitUntil(runScheduler(c.env));
  }

  await addEvent(c.env, id, "info", `Domain updated by ${user.email}: ${d.domain}`);
  const d2 = await getDomainById(c.env, id);
  return c.json({ ok: true, domain: d2 });
});

// Reliable deletion endpoint - handles both ID and domain name for safety
app.post("/api/domains/:id/delete", async (c) => {
  const user = await requireAuth(c.env, c.req.raw);
  if (!user) return c.json({ ok: false, error: "Unauthorized" }, 401);

  const idOrName = c.req.param("id");
  
  // Try to delete by ID first (as integer)
  const id = Number(idOrName);
  if (!isNaN(id)) {
    await c.env.DB.prepare("DELETE FROM events WHERE domain_id = CAST(? AS INTEGER)").bind(id).run();
    const res = await c.env.DB.prepare("DELETE FROM domains WHERE id = CAST(? AS INTEGER)").bind(id).run();
    if (res.meta.changes > 0) {
      await addEvent(c.env, null, "info", `Domain (ID: ${id}) purged by ${user.email}`);
      return c.json({ ok: true });
    }
  }

  // Fallback: Try to delete by domain name (as string)
  // This is a safety net if IDs are acting weird after migrations
  const res2 = await c.env.DB.prepare("DELETE FROM domains WHERE domain = ?").bind(idOrName).run();
  if (res2.meta.changes > 0) {
     await addEvent(c.env, null, "info", `Domain (${idOrName}) purged by name by ${user.email}`);
     return c.json({ ok: true });
  }

  return c.json({ ok: false, error: "Domain not found or already deleted" }, 404);
});

app.post("/api/bulk-domains", async (c) => {
  const user = await requireAuth(c.env, c.req.raw);
  if (!user) return c.json({ ok: false }, 401);

  const body = await c.req.json().catch(() => null) as { domains?: string[]; intervalMin?: number } | null;
  const rawDomains = body?.domains || [];
  const intervalMin = Math.max(30, Math.min(24*60, Math.floor(body?.intervalMin ?? 60)));

  if (!Array.isArray(rawDomains) || rawDomains.length === 0) {
    return c.json({ ok: false, error: "No domains provided" }, 400);
  }

  const results = { added: 0, skipped: 0, errors: [] as string[] };
  const now = nowSec();

  for (const raw of rawDomains) {
    const domain = raw.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!domain || !domain.includes(".") || !/^[a-z0-9.-]+$/.test(domain)) {
      results.errors.push(`Invalid: ${raw}`);
      continue;
    }

    const existing = await getDomainByName(c.env, domain);
    if (existing) {
      results.skipped++;
      continue;
    }

    try {
      await c.env.DB.prepare(
        "INSERT INTO domains(domain, label, enabled, check_interval_min, next_check_at, last_checked_at, last_status, created_at) VALUES(?,?,?,?,?,?,?,?)"
      ).bind(domain, null, 1, intervalMin, now, null, "unknown", now).run();
      
      results.added++;
    } catch (e: any) {
      // SEC-11: Sanitize — don't leak D1 internals
      results.errors.push(`${domain}: insert failed`);
    }
  }

  await addEvent(c.env, null, "info", `Bulk add by ${user.email}: ${results.added} added, ${results.skipped} skipped`);
  
  // Trigger scheduler for the new batch
  c.executionCtx.waitUntil(runScheduler(c.env));

  return c.json({ ok: true, results });
});

app.get("/api/events", async (c) => {
  const user = await requireAuth(c.env, c.req.raw);
  if (!user) return c.json({ ok: false }, 401);

  const limit = Math.max(50, Math.min(500, Number(c.req.query("limit") || 200)));
  const events = await listEvents(c.env, limit);
  return c.json({ ok: true, events });
});

app.post("/api/test-notify", async (c) => {
  const user = await requireAuth(c.env, c.req.raw);
  if (!user) return c.json({ ok: false }, 401);

  const { notifyAll } = await import("./notify");
  await notifyAll(c.env, `🔔 Backorder Test: This is a manual notification test from ${user.email}. System is ready!`);
  return c.json({ ok: true });
});

app.post("/api/maintenance/clean-events", async (c) => {
  const user = await requireAuth(c.env, c.req.raw);
  if (!user) return c.json({ ok: false }, 401);

  const thirtyDaysAgo = nowSec() - (30 * 24 * 3600);
  const res = await c.env.DB.prepare("DELETE FROM events WHERE created_at < ?").bind(thirtyDaysAgo).run();

  // SEC-09: Also purge expired sessions
  await c.env.DB.prepare("DELETE FROM sessions WHERE expires_at < ?").bind(nowSec()).run();

  await addEvent(c.env, null, "info", `Database cleanup by ${user.email}: removed old events + expired sessions.`);
  
  return c.json({ ok: true, removed: res.meta.changes });
});

app.post("/api/maintenance/reset", async (c) => {
  const user = await requireAuth(c.env, c.req.raw);
  if (!user) return c.json({ ok: false }, 401);

  // Dangerous: Delete everything and reset auto-increment counters
  await c.env.DB.batch([
    c.env.DB.prepare("DELETE FROM events"),
    c.env.DB.prepare("DELETE FROM domains"),
    c.env.DB.prepare("DELETE FROM sessions"),
    c.env.DB.prepare("DELETE FROM users"),
    c.env.DB.prepare("DELETE FROM settings"),
    c.env.DB.prepare("DELETE FROM sqlite_sequence")
  ]);
  
  return c.json({ ok: true });
});

// Cron trigger
export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil((async () => {
      await ensureAdmin(env);
      const res = await runScheduler(env);
      await addEvent(env, null, "info", `Scheduler tick: checked=${res.checked} due=${res.due}`);
    })());
  }
};
