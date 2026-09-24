# Constitution

This document defines the engineering standards, code conventions, and UI/UX patterns expected in the Backorder Domain Monitor project.

## 🛠️ Code Quality and Linting Standards

### 1. Type Safety
- Strict TypeScript configuration is enabled across the frontend and backend.
- Do not use `any` type annotations unless absolutely necessary. Propose explicit interfaces or utility types.
- Ensure all modules pass `npm run typecheck` prior to submission.

### 2. Linting & Formatting
- Code formatting and style rules are checked using ESLint.
- Always run `npm run lint` in the `worker` subdirectory to detect quality alerts or unused imports.

---

## 🎨 UI/UX Design System Standards (DomainPulse v2.0)

### 1. Telemetry Status & Indicators
- Adopt the **DomainPulse** telemetry visual language:
  - Electric Mint (`#00f5a0` / `primary-container`) for Available / Drop Ready domains with animated pulse indicators.
  - Cyan / Cobalt (`#4cd7f6` / `secondary`) for active sweeps and optimal check states.
  - Flame Orange / Amber (`#ff5722` / `tertiary`) for imminent drops (<2h) or rate-limited states.
  - Badges and chips: Compact pills with uppercase letter-spaced font (`label-caps`) and 15% opacity tint backgrounds matching the accent color.

### 2. Centered Login Experience
- The authentication screen must be minimalist, centered, technical, and distraction-free with subtle telemetry glow.

### 3. Dynamic Navigation
- Header buttons (Dashboard, Activity, Settings) and quick actions must only be rendered once the user has successfully authenticated.

### 4. Safety First Confirmation Modals
- **Rule**: Never use native browser `confirm()` popups for destructive actions (e.g., Domain removal, Factory Reset, database purges).
- **Pattern**: Implement custom themed modals with explicit confirmations to prevent accidental data loss.

### 5. Unified Footer Layout
- The global page footer must be consistent across both the unauthenticated Login state and the authenticated views, with responsive positioning.


---

## 🔧 Maintenance and Versioning

### 1. Changelog Updates
- Document all notable features, fixes, and architectural adjustments in `CHANGELOG.md` under standardized headers (e.g., `🛡️ Deep Security Hardening`, `🚀 Major Architectural Shift`, `✨ UI & UX Overhaul`).

### 2. Commit Hygiene
- Keep commits focused and atomic.
- Suggested prefixes: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `style:`.
- Ensure changes compile locally before pushing.
