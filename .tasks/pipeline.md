# Tasks Pipeline

This document defines active milestones, immediate task lists, validation plans, and current project backlog.

## 🏁 Current Project State
The repository has been successfully migrated to the **Project Memory Bank** structure. No source files were touched. Current deployment and configuration setups are intact.

---

## 🏃 Active Sprint: Memory Bank Initialization
- [x] Initial codebase discovery and shape inspection
- [x] Write `.memory-bank/` configuration and operational files
- [x] Extract core specifications (`bootstrap.md`, `boundary-conditions.md`, `constitution.md`)
- [x] Relocate historical `.antigravity/project-state.md` to `.archive/` and record in migration map
- [ ] Confirm and finalize migration with the user (Interactive Mode Git Stage & Commit approval)

---

## 📋 Backlog & Planned Roadmaps

### 1. Verification of Local Setup
- [x] Install dependencies in `frontend` and `worker` directories. [Verified]
- [x] Run typechecks and linters locally to verify no pre-existing issues. (Typechecks and linters pass successfully for both frontend and worker).



### 2. Feature Roadmap (From Project State)
- [x] Integrate safety/health score indicator for check frequencies. (Implemented in frontend table and add modals with optimal/high load/eco markers).
- [x] Support WHOIS fallback when RDAP is missing/fails for specific TLDs. (Implemented backend query over TCP using cloudflare:sockets, including dynamic TLD parser and expiry date scanner).
- [ ] Implement multi-user support (low priority).

### 3. RDAP Rate Limit Resilience & Adaptive Backoff Hardening (Gelecek Aşama)
*Kök Neden & Bağlam:* Cloudflare Worker ortak çıkış IP havuzu (AS13335) üzerinden Google Registry (`pubapi.registry.google`) gibi otoriter servislere yapılan isteklerin geçici HTTP 429 alması ve mevcut scheduler koruma algoritmasının aşırı agresif gecikmeyle (6h/12h/24h) domaini 24 saat kilitli tutması.
- [ ] **Akılcı Backoff Kademeleri (`worker/src/scheduler.ts`)**: 429 hataları için mevcut 6h -> 12h -> 24h gecikme basamaklarını 15m -> 30m -> 1h (maks 2h) seviyesine revize etmek.
- [ ] **Force Sweep Sıfırlaması (`worker/src/index.ts`)**: Kullanıcı arayüzden "Sweep Now" (manuel kontrol) tetiklediğinde `consecutive_errors = 0` ve `last_error = NULL` yaparak temiz bir retry ortamı sağlamak.
- [ ] **Akıllı Retry ve Failover (`worker/src/rdap.ts`)**: 429 yanıtı alındığında 1-2 saniye smart jitter ile anlık tek seferlik yeniden deneme ve gerekirse `rdap.org` bootstrap servisine anlık failover yönlendirmesi yapmak.
- [ ] **WHOIS-Olmayan gTLD Telemetri Netliği**: Port 43 WHOIS servisi bulunmayan gTLD'lerde (.dev, .app vb.) olası geçici limitlerde telemetri durumunu arayüzde kullanıcıya daha şeffaf yansıtmak.


---

## 🛡️ Suggested Validation Plan

Since this was a metadata-only change:
1. Verify git status lists new files correctly under `.memory-bank/`, `.specs/`, `.agents/`, `.tasks/`, and `.archive/`.
2. Ensure no untracked or modified files exist inside `frontend` or `worker` source code.
