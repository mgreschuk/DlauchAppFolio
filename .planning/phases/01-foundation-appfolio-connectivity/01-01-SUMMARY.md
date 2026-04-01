---
phase: 01-foundation-appfolio-connectivity
plan: "01"
subsystem: auth
tags: [next.js, drizzle, neon, auth.js, bcryptjs, tailwind, shadcn, postgresql, jwt]

# Dependency graph
requires: []
provides:
  - Next.js 16.2.2 project scaffolded with App Router, TypeScript, Tailwind v4
  - Drizzle schema with users and activityLog tables (D-06 spec)
  - Auth.js v5 Credentials provider with single-user JWT sessions
  - Login page matching UI-SPEC (Turnkey branding, shadcn/ui components)
  - Protected routes via Next.js 16 proxy convention
  - .env.example with all required environment variable templates
affects: [02-portal-shell, 03-engine-primitives, 04-connectivity-deploy]

# Tech tracking
tech-stack:
  added:
    - next@16.2.2 (App Router, TypeScript, Tailwind v4)
    - drizzle-orm@0.45.x with drizzle-kit
    - @neondatabase/serverless (Neon PostgreSQL driver)
    - next-auth@beta (Auth.js v5)
    - bcryptjs (password hashing)
    - zod@v4 (validation)
    - pg-boss@10.x (background job queue)
    - @tanstack/react-query@v5
    - date-fns@v4
    - shadcn/ui (button, input, label, card, badge, separator)
    - lucide-react (icons)
  patterns:
    - Drizzle schema-first with neon-http driver
    - Auth.js v5 Credentials provider reading from env vars (single-user D-01)
    - JWT sessions 30-day maxAge (D-03)
    - Next.js 16 proxy convention (replaces middleware.ts)

key-files:
  created:
    - src/db/schema.ts (Drizzle schema: users + activityLog tables)
    - src/db/index.ts (Neon serverless db client)
    - drizzle.config.ts (migration config)
    - src/auth.ts (Auth.js v5 Credentials provider)
    - src/app/api/auth/[...nextauth]/route.ts (Auth.js route handler)
    - src/proxy.ts (Next.js 16 route protection)
    - src/app/login/page.tsx (login UI matching UI-SPEC)
    - src/app/dashboard/page.tsx (placeholder for Plan 02)
    - .env.example (all required env var templates)
  modified:
    - src/app/layout.tsx (Turnkey title, Inter font, slate-950 bg)
    - src/app/page.tsx (redirect to /dashboard)
    - .gitignore (allow .env.example)

key-decisions:
  - "Next.js 16.2.2 used (create-next-app installed 16.x, not 15.5 as planned) — stack is forward-compatible"
  - "proxy.ts replaces middleware.ts per Next.js 16 deprecation — auth as proxy export"
  - "activityLog JSONB fields: inputs, planned_actions, expected_outputs (D-06)"
  - "Single-user auth reads ADMIN_EMAIL + ADMIN_PASSWORD_HASH from env vars (D-01)"
  - "JWT strategy, 30-day maxAge, 1-day updateAge (D-03)"

patterns-established:
  - "Auth pattern: Credentials provider → env var comparison → JWT session"
  - "DB pattern: neon() sql client → drizzle() with schema → typed queries"
  - "UI pattern: shadcn components + Tailwind utility classes for all interactive elements"
  - "Route protection: proxy.ts matcher excludes api/auth, login, static assets"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03, LOG-01]

# Metrics
duration: 10min
completed: 2026-04-01
---

# Phase 1 Plan 01: Scaffold + Auth Summary

**Next.js 16 project with Drizzle/Neon schema (users + activityLog), Auth.js v5 JWT credentials provider, and dark-theme login page matching Turnkey UI-SPEC**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-04-01T23:33:55Z
- **Completed:** 2026-04-01T23:44:00Z
- **Tasks:** 2 of 2
- **Files modified:** 15

## Accomplishments
- Scaffolded greenfield Next.js 16 project with App Router, TypeScript, Tailwind v4, all Phase 1 dependencies
- Defined Drizzle schema with `users` and `activityLog` tables matching D-06 spec (JSONB inputs, enum status)
- Configured Auth.js v5 with Credentials provider, JWT sessions (30-day expiry), single-user env var auth (D-01)
- Login page built to UI-SPEC: Turnkey product name, Revel 1 subtitle, slate dark theme, shadcn components, loading/error states

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Next.js 15 project with Drizzle schema and shadcn/ui** - `ae600e0` (feat)
2. **Task 2: Configure Auth.js v5 with credentials provider and login/logout** - `88705bc` (feat)

**Plan metadata:** (created below in final commit)

## Files Created/Modified

- `src/db/schema.ts` - Drizzle schema: users table + activityLog table with D-06 fields (JSONB, enum)
- `src/db/index.ts` - Neon serverless db client (drizzle-orm/neon-http)
- `drizzle.config.ts` - Drizzle Kit migration configuration
- `src/auth.ts` - Auth.js v5: Credentials provider, JWT strategy, 30-day sessions
- `src/app/api/auth/[...nextauth]/route.ts` - Auth.js GET/POST route handler
- `src/proxy.ts` - Next.js 16 proxy (route protection, excludes /login and /api/auth)
- `src/app/login/page.tsx` - Login UI: Turnkey branding, email/password form, shadcn components
- `src/app/dashboard/page.tsx` - Placeholder dashboard page (Plan 02 will replace)
- `.env.example` - All required environment variable templates
- `src/app/layout.tsx` - Updated: "Turnkey — 3Y Realty" title, Inter font, slate-950 background
- `src/app/page.tsx` - Redirect to /dashboard
- `.gitignore` - Added !.env.example exception

## Decisions Made
- **Next.js 16.2.2 used instead of 15.5:** `create-next-app@latest` resolved to 16.2.2. The stack is forward-compatible; no features planned for this phase depend on 15.x-specific behavior. Documenting for team awareness.
- **proxy.ts over middleware.ts:** Next.js 16 deprecated `middleware.ts` in favor of `proxy.ts`. Adopted the new convention immediately rather than carrying a deprecation warning.
- **Dashboard placeholder:** Auth redirects to /dashboard; a minimal stub page created to prevent 404. Plan 02 will replace it with the full portal shell.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Renamed middleware.ts to proxy.ts for Next.js 16 compatibility**
- **Found during:** Task 2 (Auth.js configuration)
- **Issue:** `create-next-app@latest` installed Next.js 16.2.2 (not 15.5 as planned). Next.js 16 deprecated `src/middleware.ts` — build emitted deprecation warning pointing to `src/proxy.ts` convention. Auth.js `auth as middleware` export renamed to `auth as proxy`.
- **Fix:** Created `src/proxy.ts` with `export { auth as proxy }` instead of `src/middleware.ts`
- **Files modified:** src/proxy.ts (created), src/middleware.ts (never committed)
- **Verification:** `npm run build` passes with zero warnings
- **Committed in:** `88705bc` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 3 - blocking build warning)
**Impact on plan:** Functionally equivalent — route protection works identically. No scope creep. Next.js 16 is a minor version bump from 15.5 with no breaking API changes for this phase's features.

## Issues Encountered
- Directory not empty (had `.planning/` and `CLAUDE.md`) when running `create-next-app` — scaffolded to temp directory and moved files over. Preserved all planning artifacts.

## Known Stubs
- `src/app/dashboard/page.tsx` — Placeholder "coming in Plan 02" message. Not a stub that blocks this plan's goal (login/auth). Plan 02 replaces this with the full portal shell.

## User Setup Required

Before running locally or deploying:

1. Copy `.env.example` to `.env.local` and fill in all values:
   - `DATABASE_URL` — Neon PostgreSQL connection string
   - `AUTH_SECRET` — Generate with: `openssl rand -base64 32`
   - `AUTH_URL` — `http://localhost:3000` for local development
   - `ADMIN_EMAIL` — Admin user email address
   - `ADMIN_PASSWORD_HASH` — bcrypt hash of admin password. Generate with:
     ```js
     node -e "const {hashSync}=require('bcryptjs'); console.log(hashSync('yourpassword', 12))"
     ```
   - `APPFOLIO_CLIENT_ID`, `APPFOLIO_CLIENT_SECRET`, `APPFOLIO_BASE_URL`, `APPFOLIO_DATABASE_ID` — From AppFolio API credentials

2. Push schema to Neon database:
   ```bash
   npx drizzle-kit push
   ```

## Next Phase Readiness
- Authenticated portal shell (Plan 02) can build on top of Auth.js session — use `auth()` from `@/auth` to get the session in server components
- Database connection via `import { db } from "@/db"` is ready for Plan 03 (engine primitives + activity log writes)
- All shadcn Phase 1 components installed and ready for Plan 02 portal shell layout
- **Concern:** Next.js 16 vs planned 15.5 — verify other plans' specific Next.js features are available in 16.x before execution

## Self-Check: PASSED

- All 10 key files verified present on disk
- Commits ae600e0 and 88705bc confirmed in git log
- `npm run build` exits 0 with no errors

---
*Phase: 01-foundation-appfolio-connectivity*
*Completed: 2026-04-01*
