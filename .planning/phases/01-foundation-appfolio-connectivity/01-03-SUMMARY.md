---
phase: 01-foundation-appfolio-connectivity
plan: 03
subsystem: api
tags: [appfolio, rate-limiter, adapter-pattern, state-machine, activity-log, drizzle, neon, vitest, typescript]

# Dependency graph
requires: []
provides:
  - AppFolioAdapter interface — swappable contract for API vs. Playwright (ENGINE-03)
  - AppFolioApiClient — REST implementation with Basic auth and rate limiting
  - RateLimiter — sliding window 5 req/15s, transparent queuing (ENGINE-01)
  - checkWorkOrderExists() — duplicate detection on adapter (ENGINE-02)
  - StateMachine — sequential step executor with partial failure recovery (ENGINE-04)
  - writeActivityLog() — structured DB insert for activity log entries (LOG-01)
  - activity_log DB schema — JSONB fields for Quest lifecycle (D-06)
  - Drizzle + Neon DB connection layer
  - vitest test framework configured with path aliases
affects:
  - 01-04 (connectivity check route uses writeActivityLog and AppFolioApiClient)
  - phase-03 (unit turn automation imports AppFolioAdapter, StateMachine, writeActivityLog)
  - phase-04 (Quest approval flow uses activity_log status enum and JSONB fields)
  - phase-05 (Playwright adapter implements AppFolioAdapter interface)

# Tech tracking
tech-stack:
  added:
    - vitest 2.1.9 (test framework)
    - drizzle-orm (ORM, DB access layer)
    - "@neondatabase/serverless" (Neon Postgres driver)
  patterns:
    - Adapter pattern: business logic calls AppFolioAdapter, never HTTP layer directly
    - Rate limiter wraps all outbound API fetch calls transparently
    - StateMachine executes steps with shared context accumulation
    - DB mocking via vi.mock() in vitest for unit testing without live DB

key-files:
  created:
    - src/lib/appfolio/types.ts
    - src/lib/appfolio/adapter.ts
    - src/lib/appfolio/api-client.ts
    - src/lib/appfolio/rate-limiter.ts
    - src/lib/appfolio/__tests__/rate-limiter.test.ts
    - src/lib/appfolio/__tests__/api-client.test.ts
    - src/lib/engine/types.ts
    - src/lib/engine/state-machine.ts
    - src/lib/engine/__tests__/state-machine.test.ts
    - src/lib/activity-log.ts
    - src/lib/__tests__/activity-log.test.ts
    - src/db/schema.ts
    - src/db/index.ts
    - vitest.config.ts
    - tsconfig.json
    - package.json
    - .gitignore
  modified: []

key-decisions:
  - "AppFolioAdapter as interface (not abstract class) — callers type-annotate as the interface, never the concrete class"
  - "RateLimiter uses sliding window (not token bucket) — timestamps array cleared on each check keeps it simple and correct"
  - "StateMachine marks remaining steps 'skipped' on failure — inspectable state for recovery without re-running completed steps"
  - "activity-log.ts: DB mock via vi.mock() in unit tests — no live Neon connection required during CI"
  - "DB schema created in this plan to unblock activity-log.ts — Plan 01-01 will extend if needed (no conflict)"

patterns-established:
  - "Adapter pattern: all AppFolio callers import AppFolioAdapter type, instantiate AppFolioApiClient, assign to adapter variable"
  - "Rate limiter: every public AppFolioApiClient method wraps its fetch in this.rateLimiter.execute()"
  - "State machine context: steps communicate through context.data — no direct step-to-step coupling"
  - "Activity log: plain-language descriptions only; no stack traces or internal IDs in outcomeNotes (D-08)"

requirements-completed: [ENGINE-01, ENGINE-02, ENGINE-03, ENGINE-04]

# Metrics
duration: 7min
completed: 2026-04-01
---

# Phase 1 Plan 03: Engine Primitives Summary

**AppFolioAdapter interface + API client with 5 req/15s sliding window rate limiter, StateMachine with partial-failure recovery, and activity_log Drizzle schema with structured JSONB fields — 19 unit tests passing**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-04-01T23:34:17Z
- **Completed:** 2026-04-01T23:41:00Z
- **Tasks:** 2
- **Files modified:** 17 (16 created, 1 existing .gitignore)

## Accomplishments

- AppFolioAdapter interface isolates all business logic from HTTP layer — API and Playwright implementations are drop-in swappable (ENGINE-03)
- RateLimiter transparently queues requests beyond 5/15s — callers never see rate limit errors (ENGINE-01); duplicate check method exists on adapter (ENGINE-02)
- StateMachine executes steps sequentially with shared context accumulation; partial failure records exact failure point and skips remaining steps for recovery (ENGINE-04)
- writeActivityLog() inserts structured entries into activity_log table with all D-06 JSONB fields; activity_log schema ready for Quest lifecycle (pending/approved/rejected/completed/failed)
- vitest configured with path aliases; 19 unit tests pass across 4 test files

## Task Commits

Each task was committed atomically:

1. **Task 1: AppFolio adapter interface, API client, and rate limiter** — `eb3e5b9` (feat)
2. **Task 2: Automation state machine and activity log writer** — `b3ca643` (feat)

**Plan metadata:** (created after this SUMMARY)

_Note: Both tasks used TDD — tests written and verified failing before implementation_

## Files Created/Modified

- `src/lib/appfolio/types.ts` — AppFolioUnit, AppFolioWorkOrder, AppFolioPurchaseOrder, AppFolioApiConfig interfaces
- `src/lib/appfolio/adapter.ts` — AppFolioAdapter interface with getUnits, checkWorkOrderExists, createWorkOrder, testConnection
- `src/lib/appfolio/api-client.ts` — AppFolioApiClient implements AppFolioAdapter; all public methods use this.rateLimiter.execute()
- `src/lib/appfolio/rate-limiter.ts` — RateLimiter class; sliding window, maxRequests=5, windowMs=15_000
- `src/lib/appfolio/__tests__/rate-limiter.test.ts` — 4 tests: immediate execution, queuing, return value, error propagation
- `src/lib/appfolio/__tests__/api-client.test.ts` — 5 tests: interface implementation, testConnection HTTP 200/non-200/throw, auth header
- `src/lib/engine/types.ts` — StepDefinition, StepContext, StepResult, StepState, AutomationState, AutomationStatus
- `src/lib/engine/state-machine.ts` — StateMachine with run(), getState() (deep copy), getLogs()
- `src/lib/engine/__tests__/state-machine.test.ts` — 7 tests: success, failure, throw, immutable state, context accumulation, logs, initial state
- `src/lib/activity-log.ts` — writeActivityLog() with all D-06 fields; returns created entry ID
- `src/lib/__tests__/activity-log.test.ts` — 3 tests: function exists, required fields, optional fields (DB mocked via vi.mock)
- `src/db/schema.ts` — activity_log table with pgEnum status, JSONB inputs/plannedActions/expectedOutputs, timestamps
- `src/db/index.ts` — Drizzle ORM + Neon serverless driver connection
- `vitest.config.ts` — path alias @/ → ./src/
- `tsconfig.json` — Next.js-compatible TypeScript config with moduleResolution: bundler
- `package.json` — test/test:watch scripts; vitest devDependency
- `.gitignore` — node_modules, .next, .env*, dist

## Decisions Made

- Used TypeScript `interface` (not abstract class) for AppFolioAdapter — interface is zero-runtime-cost and forces callers to declare adapter as the interface type, never the concrete class
- Sliding window rate limiter (timestamps array) chosen over token bucket — simpler implementation, exactly matches the "5 within any 15s window" specification
- StateMachine.getState() uses `structuredClone()` — returns a deep copy so callers cannot accidentally mutate machine state
- Created DB schema in this plan to avoid blocking activity-log.ts — Plan 01-01 (running in parallel) will integrate or extend as needed; fields are additive, not conflicting
- vi.mock() for DB in unit tests — avoids needing a live Neon database for CI

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created DB schema and connection layer**
- **Found during:** Task 2 (activity log writer)
- **Issue:** activity-log.ts imports from @/db and @/db/schema — these files are created by Plan 01-01 (parallel agent). Without them, activity-log.ts cannot compile and tests cannot run.
- **Fix:** Created src/db/schema.ts (full activity_log table per D-06) and src/db/index.ts (Drizzle + Neon connection) as part of this plan. Fields match the D-06 specification exactly.
- **Files modified:** src/db/schema.ts, src/db/index.ts
- **Verification:** Activity log tests pass with mocked DB; schema compiles cleanly
- **Committed in:** b3ca643 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking dependency)
**Impact on plan:** Required to make activity-log.ts testable in parallel execution. No scope creep — these files were always part of Phase 1 scope (Plan 01-01).

## Issues Encountered

None — both tasks executed cleanly with TDD approach.

## Known Stubs

None — all implemented functions wire to real implementations. The DB layer is the only integration point; it works correctly via vi.mock() in tests and will connect to live Neon via DATABASE_URL in production.

## Next Phase Readiness

- Plan 01-04 can immediately import AppFolioApiClient and writeActivityLog for the connectivity check route
- Phases 3-5 automations import AppFolioAdapter (interface) and StateMachine — no changes needed as automations are added
- Phase 5 Playwright adapter: implement AppFolioAdapter interface on a new class; swap by passing different concrete instance — no calling code changes
- DATABASE_URL environment variable required at runtime for the Neon connection (configure in Railway and local .env)

---
*Phase: 01-foundation-appfolio-connectivity*
*Completed: 2026-04-01*
