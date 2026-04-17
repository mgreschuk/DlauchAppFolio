---
phase: 02-scope-matrix
plan: "01"
subsystem: database-api
tags: [drizzle, neon, api-routes, zod, scopes, crud]
dependency_graph:
  requires: []
  provides: [scopes-table, scopes-api]
  affects: [02-02-scope-matrix-ui]
tech_stack:
  added: []
  patterns: [drizzle-orm-push, nextjs-route-handlers, zod-v4-validation]
key_files:
  created:
    - src/app/api/scopes/route.ts
    - src/app/api/scopes/[id]/route.ts
    - src/app/api/scopes/[id]/toggle/route.ts
  modified:
    - src/db/schema.ts
decisions:
  - "Params accessed via RouteContext<path> helper with await per Next.js 16 convention"
  - "Unique constraint violation detected by error message string match (duplicate key / unique constraint) — consistent with Neon/pg error format"
  - "drizzle-kit push (not generate/migrate) per established Phase 1 pattern"
metrics:
  duration: ~8 min
  completed: "2026-04-17T16:03:57Z"
  tasks_completed: 2
  files_created: 3
  files_modified: 1
---

# Phase 2 Plan 1: Scopes Database Schema and API Routes Summary

**One-liner:** Drizzle `scopes` table with unique constraint pushed to Neon, plus five REST handlers (GET/POST list+create, GET/PUT read+update, PATCH toggle) with Zod v4 validation and 400/404/409/500 error codes.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Add scopes table to Drizzle schema and push to database | e42d734 | src/db/schema.ts |
| 2 | Create CRUD API routes for scopes | bc4dabf | src/app/api/scopes/route.ts, src/app/api/scopes/[id]/route.ts, src/app/api/scopes/[id]/toggle/route.ts |

## What Was Built

### scopes table (src/db/schema.ts)

Eight-column table appended to the existing schema:
- `id` — uuid PK with defaultRandom
- `scope_name` — varchar(255) not null, unique constraint per D-11
- `category` — varchar(255) not null
- `vendor` — varchar(255) not null
- `work_description` — text not null
- `is_active` — boolean not null default true (soft-delete per MATRIX-04)
- `created_at` / `updated_at` — timestamp with timezone

`boolean` was added to the drizzle-orm/pg-core import line. No existing tables were modified. Schema was pushed to Neon via `npx drizzle-kit push`.

### API Routes

**GET /api/scopes** — Returns all active scopes ordered by name. `?includeInactive=true` returns all entries.

**POST /api/scopes** — Validates body with Zod (scopeName, category, vendor, workDescription all required). Returns 201 on success, 400 on validation failure, 409 on duplicate scope name, 500 on unexpected error.

**GET /api/scopes/:id** — Returns single scope or 404.

**PUT /api/scopes/:id** — Updates scope with partial Zod validation (all fields optional). Returns updated scope, 404 if not found, 409 on duplicate name conflict, 400 on validation failure.

**PATCH /api/scopes/:id/toggle** — Fetches current scope, flips `isActive` flag, returns updated scope. Returns 404 if not found.

All handlers follow established patterns: `NextResponse.json`, `db` from `@/db`, `scopes` from `@/db/schema`, drizzle-orm query builders. Dynamic route params accessed via `RouteContext<path>` helper with `await ctx.params` per Next.js 16 convention.

## Decisions Made

- **RouteContext helper for dynamic params:** Next.js 16 provides a globally-typed `RouteContext<path>` helper for route handlers. Using `ctx: RouteContext<"/api/scopes/[id]">` and `await ctx.params` is the idiomatic pattern — avoids the older `{ params }` destructuring which becomes a Promise in Next.js 15+.

- **Unique constraint error detection:** Neon/pg raises errors containing "duplicate key" or "unique constraint" in the message string. Matching on these substrings is consistent with the underlying pg driver behavior and avoids importing pg error types.

- **drizzle-kit push (no migration files):** Consistent with Phase 1 pattern. No `drizzle/` migration files generated.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all handlers are fully wired to the Neon database via Drizzle ORM. No mock data or placeholder responses.

## Self-Check: PASSED

- src/db/schema.ts — FOUND, contains `export const scopes = pgTable("scopes"`
- src/app/api/scopes/route.ts — FOUND, exports GET and POST
- src/app/api/scopes/[id]/route.ts — FOUND, exports GET and PUT
- src/app/api/scopes/[id]/toggle/route.ts — FOUND, exports PATCH
- Commits e42d734 and bc4dabf — FOUND in git log
- `npm run build` — exits 0, all 3 routes appear in route table
