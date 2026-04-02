---
phase: 01-foundation-appfolio-connectivity
plan: 04
subsystem: infra
tags: [appfolio, tanstack-query, status-api, activity-log, dockerfile, railway, github-actions, pg-boss, standalone]

# Dependency graph
requires:
  - phase: 01-foundation-appfolio-connectivity
    plan: 01
    provides: "Next.js scaffold, Auth.js session, login/logout, portal shell"
  - phase: 01-foundation-appfolio-connectivity
    plan: 02
    provides: "Authenticated layout, sidebar nav, dashboard page, shadcn/ui components"
  - phase: 01-foundation-appfolio-connectivity
    plan: 03
    provides: "AppFolioApiClient, writeActivityLog, activity_log DB schema, Drizzle+Neon connection"
provides:
  - AppFolio status API route (/api/appfolio/status) — calls testConnection() and writes activity log
  - AppFolioStatusCard component — polls status every 60s via TanStack Query, shows connected/failed badge
  - Providers component — QueryClientProvider wrapper for authenticated layout
  - Dockerfile — multi-stage Node 20 Alpine build with standalone output
  - railway.toml — Dockerfile builder, /api/health healthcheck, on_failure restart
  - /api/health route — Railway health check endpoint
  - src/worker.ts — pg-boss worker with SIGTERM/SIGINT graceful shutdown
  - .github/workflows/ci.yml — CI pipeline (tsc, lint, vitest, build)
affects:
  - phase-02 (matrix data feeds into activity log entries)
  - phase-03 (unit turn automation uses same status card pattern and activity log write path)

# Tech tracking
tech-stack:
  added:
    - tsx (devDependency — runs worker.ts directly)
  patterns:
    - TanStack Query polling pattern: useQuery with refetchInterval for live status cards
    - Lazy DB singleton via Proxy — avoids DATABASE_URL throw at Next.js build-time module evaluation
    - Providers component pattern — QueryClientProvider in authenticated layout, not per-page

key-files:
  created:
    - src/app/api/appfolio/status/route.ts
    - src/components/appfolio-status-card.tsx
    - src/components/providers.tsx
    - Dockerfile
    - .dockerignore
    - railway.toml
    - src/app/api/health/route.ts
    - src/worker.ts
    - .github/workflows/ci.yml
  modified:
    - src/app/(authenticated)/dashboard/page.tsx
    - src/app/(authenticated)/layout.tsx
    - src/db/index.ts
    - next.config.ts
    - package.json

key-decisions:
  - "Lazy DB singleton via Proxy in src/db/index.ts — DATABASE_URL check deferred to request time, not module evaluation; required for Next.js standalone build to pass without env vars set"
  - "Named import { PgBoss } from 'pg-boss' — pg-boss v12 has no default export; auto-fixed during Task 2"
  - "QueryClientProvider in authenticated layout (not root) — scopes client state to authenticated pages only"

patterns-established:
  - "TanStack Query polling: useQuery({ queryKey, queryFn, refetchInterval }) for any live-status UI component"
  - "Providers pattern: create src/components/providers.tsx as 'use client' wrapper, import in layout — never duplicate per page"
  - "DB connection lazy init: wrap drizzle() in a function, expose via Proxy singleton — standard pattern for serverless/build safety"

requirements-completed: [ENGINE-01, LOG-01]

# Metrics
duration: 10min
completed: 2026-04-02
---

# Phase 1 Plan 04: Connectivity + Deploy Summary

**AppFolio status route wired to dashboard via TanStack Query polling, activity log write-path proven, Dockerfile + Railway config + GitHub Actions CI + pg-boss worker ready for deployment**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-04-02T00:58:14Z
- **Completed:** 2026-04-02T01:08:00Z
- **Tasks:** 2 of 3 (Task 3 is human-verify checkpoint — pending deployment)
- **Files modified:** 13 (9 created, 4 modified)

## Accomplishments

- AppFolio status API route calls testConnection() on demand and writes activity log entry on every check — proving the full DB write path works (D-07)
- Dashboard replaced placeholder card with AppFolioStatusCard — TanStack Query polls /api/appfolio/status every 60s, showing "Connected to sandbox" (blue badge) or "Connection failed" (red badge)
- Deployment infrastructure complete: Dockerfile (multi-stage, standalone), railway.toml (healthcheck), /api/health endpoint, pg-boss worker with graceful shutdown, GitHub Actions CI pipeline

## Task Commits

Each task was committed atomically:

1. **Task 1: AppFolio status API route, dashboard integration, activity log wiring** — `469f2f0` (feat)
2. **Task 2: Deployment infrastructure — Dockerfile, CI, Railway config, pg-boss worker** — `67cad71` (feat)
3. **Task 3: Verify deployed app on Railway** — PENDING (checkpoint:human-verify)

## Files Created/Modified

- `src/app/api/appfolio/status/route.ts` — GET endpoint: instantiates AppFolioApiClient, calls testConnection(), writes activity log entry, returns JSON
- `src/components/appfolio-status-card.tsx` — "use client"; useQuery polls /api/appfolio/status every 60s; displays Connected to sandbox / Connection failed badges
- `src/components/providers.tsx` — QueryClientProvider wrapper; "use client" singleton pattern
- `src/app/(authenticated)/layout.tsx` — wrapped with Providers for TanStack Query context
- `src/app/(authenticated)/dashboard/page.tsx` — placeholder replaced with AppFolioStatusCard
- `src/db/index.ts` — refactored to lazy Proxy singleton (build-safe, no env throw at module load)
- `Dockerfile` — node:20-alpine multi-stage; deps → builder → runner; standalone output; CMD node server.js
- `.dockerignore` — node_modules, .next, .git, .env files
- `next.config.ts` — added output: "standalone"
- `railway.toml` — dockerfile builder, healthcheckPath /api/health, on_failure restart
- `src/app/api/health/route.ts` — returns { status: "ok", timestamp }
- `src/worker.ts` — PgBoss named import; boss.start(); SIGTERM/SIGINT graceful shutdown
- `.github/workflows/ci.yml` — Node 20, npm ci, tsc --noEmit, lint, vitest run, build
- `package.json` — added worker/worker:dev scripts, tsx devDependency

## Decisions Made

- Lazy DB singleton via Proxy pattern in `src/db/index.ts` — necessary because Next.js evaluates route modules during `npm run build` to collect page data. The original eager throw on missing DATABASE_URL caused build failures in CI/Docker where env vars aren't set at build time. The Proxy defers initialization to the first actual DB call (request time).
- Used named import `{ PgBoss }` instead of default import — pg-boss v12 does not export a default, only named exports.
- QueryClientProvider placed in the authenticated layout rather than root layout — client state for status polling is only relevant to authenticated pages.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed DATABASE_URL eager throw breaking Next.js build**
- **Found during:** Task 1 (AppFolio status API route)
- **Issue:** `src/db/index.ts` threw `new Error("DATABASE_URL environment variable is required")` at module evaluation time. During `npm run build`, Next.js imports route modules to collect page data — this caused the build to fail when DATABASE_URL is not set (CI, Docker build stage).
- **Fix:** Refactored `src/db/index.ts` to a lazy Proxy singleton — createDb() is only called on first property access (i.e., first DB query at request time), not at import time.
- **Files modified:** src/db/index.ts
- **Verification:** `npm run build` exits 0; all 19 tests still pass
- **Committed in:** 469f2f0 (Task 1 commit)

**2. [Rule 1 - Bug] Fixed pg-boss default import (no default export in v12)**
- **Found during:** Task 2 (worker.ts)
- **Issue:** `import PgBoss from "pg-boss"` caused TypeScript type error — pg-boss v12 does not have a default export; only named exports.
- **Fix:** Changed to `import { PgBoss } from "pg-boss"` — named import.
- **Files modified:** src/worker.ts
- **Verification:** `npm run build` exits 0 after fix
- **Committed in:** 67cad71 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 Rule 1 bugs)
**Impact on plan:** Both fixes required for build correctness. No scope creep — the DB lazy init pattern is the correct approach for serverless/build environments; the pg-boss import fix is a simple API correction.

## Issues Encountered

- npm run build failed in the worktree because `node_modules` was not installed (git worktree doesn't share node_modules with parent). Ran `npm install` to initialize the worktree's local node_modules. This is a one-time setup step for any new worktree.

## User Setup Required

Before deploying, configure the following in Railway:

**Railway Web Service environment variables:**
- `DATABASE_URL` — Neon connection string (with `?sslmode=require`)
- `APPFOLIO_CLIENT_ID` — AppFolio sandbox client ID
- `APPFOLIO_CLIENT_SECRET` — AppFolio sandbox client secret
- `APPFOLIO_DATABASE_ID` — AppFolio sandbox database ID
- `AUTH_SECRET` — Generate: `openssl rand -base64 32`
- `ADMIN_EMAIL` — Admin login email
- `ADMIN_PASSWORD_HASH` — Generate: `node -e "require('bcryptjs').hash('yourpassword', 12).then(console.log)"`

**Railway Worker Service environment variables:**
- `DATABASE_URL` — same Neon connection string as web service

**Neon:**
- Create project at https://console.neon.tech
- Run `npx drizzle-kit push` after DATABASE_URL is configured to push schema

**Railway project structure:**
- Service 1 (web): Dockerfile build, this repo, main branch
- Service 2 (worker): Custom start command: `npm run worker`

## Next Phase Readiness

- All Phase 1 automation primitives are in place: adapter interface, rate limiter, state machine, activity log, DB schema
- Phase 2 (scope matrix) can immediately import writeActivityLog and AppFolioAdapter
- Phase 3 (unit turn automation) has everything it needs: AppFolioApiClient, StateMachine, activity log write path
- Pending: Railway deployment must be completed and verified (Task 3) to close Phase 1 milestone (D-04)

---
*Phase: 01-foundation-appfolio-connectivity*
*Completed: 2026-04-02 (Tasks 1-2; Task 3 pending Railway deployment verification)*
