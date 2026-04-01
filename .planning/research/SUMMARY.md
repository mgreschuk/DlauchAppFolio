# Project Research Summary

**Project:** AppFolio Automation Platform — DLauch Client Portal
**Domain:** Property management operations portal with API-integrated automation engine
**Researched:** 2026-04-01
**Confidence:** HIGH (stack, architecture, pitfalls) / MEDIUM-HIGH (features)

---

## Executive Summary

This is an internal operations portal for a ~10-person property management team, built on top of the AppFolio REST API. The core pattern is a human-in-the-loop (HITL) automation engine: a user selects a unit and scopes, the system builds a structured "Quest" proposal showing exactly what it will do, the user approves, and the automation executes against AppFolio. Research confirms this propose-commit separation is the correct safety architecture for a client whose #1 concern is data integrity. Every major HITL platform (LangGraph, Orkes, Bedrock Agents) follows this same pattern.

The recommended stack is Next.js 15 (App Router) on Railway with PostgreSQL via Neon, Drizzle ORM, pg-boss for job queuing, and Auth.js v5 for auth. This keeps infrastructure minimal — one Next.js app plus one pg-boss worker process, no Redis, no separate API server. The AppFolio Client is isolated behind an adapter interface so API calls and Playwright browser automation are interchangeable per method. This is not optional given the confirmed gap in AppFolio's PO creation API.

The dominant risk in this project is not technical — it is trust erosion from data integrity failures. A duplicate work order, a wrong vendor, or a silent automation failure in the first weeks of production will set back autonomy goals significantly. Research-backed evidence shows early automation errors have an outsized and lasting negative impact on user trust. The entire architecture must be designed around preventing partial failures, catching misconfiguration before execution, and surfacing errors actively rather than waiting for them to be discovered.

---

## Key Findings

### Recommended Stack

The stack is fully unified under Next.js, avoiding the need to maintain a separate API server or multiple deployment targets. Railway is the correct platform choice (not Vercel) because pg-boss requires a persistent worker process that serverless platforms cannot run. Neon (serverless Postgres) eliminates idle costs and provides database branching for safe development. The notable version decisions: Tailwind v4 (Rust-based Oxide engine, no config file, CSS-first theming — use from day one), Zod v4 (14x faster parsing, first-party JSON Schema generation), and Drizzle ORM over Prisma (no code-gen step, instant TypeScript reflection — critical for a solo dev feedback loop).

**Core technologies:**
- **Next.js 15.5 (App Router):** Full-stack framework — Server Components for data-heavy views, Route Handlers for API, single deployment target
- **Drizzle ORM + Neon (PostgreSQL 16):** Database layer — zero code-gen, SQL-adjacent queries, scale-to-zero hosting with database branching
- **pg-boss v10:** Background job queue — runs entirely on Postgres (no Redis), stately queues map directly to the Quest approval hold pattern, exactly-once delivery
- **Auth.js v5:** Session auth — credentials provider backed by Postgres users table, database sessions for immediate invalidation
- **shadcn/ui + Tailwind v4:** UI components — components live in the codebase (full control), already updated for React 19
- **Playwright 1.59.x:** Browser automation fallback for PO creation only — isolated behind adapter interface, never called directly from business logic
- **Railway:** Deployment — persistent compute for the pg-boss worker, one project bill covers both web app and worker

### Expected Features

**Must have (table stakes for Phase 1):**
- Scope picker + unit selector UI — primary input surface, no automation without it
- Quest evidence pack + approval flow — the trust mechanism; no preview = no trust
- Approve / Reject actions on quests — minimum viable human control point
- Work order creation via AppFolio API — core automation deliverable
- Purchase order creation — critical path; PO API gap must be resolved or fallback built
- Execution log (human-readable, not technical dump) — accountability and debugging
- Scope matrix in database (admin-editable) — client independence from developer from day one
- Scope-to-category-to-vendor routing — drives all automation inputs
- Sandbox vs. production environment switch — all development requires sandbox-first
- Multi-user access with owner/team roles — 10 users, minimal RBAC

**Should have (differentiators, Phase 1 defer to early Phase 2):**
- Quest evidence pack with unusual-condition callouts — prevents rubber-stamp approvals
- Autonomy dial (data model + UI controls) — build the structure even if only Level 1 is active
- Pre-flight unit eligibility check — validate AppFolio state before showing Quest approval screen
- Quest expiry + escalation — stale approvals cause downstream vendor problems
- Approve with edits (inline quest modification) — eliminates need to restart for minor input errors

**Defer (v2+):**
- Audit trail with before/after diff view — high value but high complexity
- Per-automation sandbox testing mode (global toggle covers Phase 1)
- Payables automation, utility expense tracking, QBO bridge
- Analytics / reporting dashboards

**Anti-features — never build:**
- LLM/AI for scope interpretation (the matrix handles this deterministically)
- Generic drag-and-drop workflow builder
- Multi-tenant SaaS architecture
- Mobile app
- RBAC beyond owner/team member

### Architecture Blueprint

The system has five layers with strict no-skip communication: Portal UI → API Layer → Automation Engine → AppFolio Client (adapter) + Data Store. The critical structural decision is that the Automation Engine is pure TypeScript with no Next.js dependency, testable in isolation. The AppFolio Client is a typed interface (`getUnits`, `createWorkOrder`, `createPurchaseOrder`) with two concrete implementations — RestAdapter and PlaywrightAdapter — selectable per method via environment config. Business logic never imports either adapter directly.

**Major components:**
1. **Portal UI** (`app/`) — React Server Components for data-heavy views (quest inbox, activity log); no business logic, no direct DB access
2. **API Layer** (`app/api/`) — Thin Next.js Route Handlers; parse request, call engine, return response; auth middleware at this boundary
3. **Automation Engine** (`lib/engine/`) — Quest builder, execution runner, state machine; all business rules live here; reads scope matrix from DB
4. **AppFolio Client** (`lib/appfolio/`) — Adapter interface + RestAdapter + PlaywrightAdapter; the only place AppFolio endpoints appear in the codebase
5. **Data Store** (`lib/db/`) — Drizzle + Neon Postgres; `quests`, `quest_steps`, `scope_matrix`, `vendors`, `users`, pg-boss job tables

**Build sequence (hard dependency order):**
DB schema → AppFolio RestAdapter (read-only) → Scope matrix seed → Quest builder → Quest persistence/state machine → Execution runner → Work order creation → PO creation → API routes → Quest inbox UI → Scope selector UI → Activity log UI → Hardening

### Top 5 Watch Outs

1. **PO creation API gap is unresolved and blocks the critical path** — The AppFolio PO API is undocumented. The adapter interface must exist before either implementation is built. Set a 2-week deadline: if no API path confirmed, build Playwright fallback as primary behind the same interface. Playwright selectors must target ARIA labels and text — never CSS classes or XPath.

2. **Partial sequence failure leaves AppFolio in a corrupted state** — Multi-step write sequences are non-atomic. AppFolio has no rollback. Every write must be preceded by an existence check (check-before-create), every completed step must be persisted immediately, and partial failures must surface in the UI with the rollback manifest (list of created record IDs). This is not optional infrastructure — it is the core reliability guarantee.

3. **Sandbox/production divergence creates false validation confidence** — The AppFolio sandbox runs an older version. Fields, defaults, and required values differ. Sandbox acceptance is not production readiness. Run side-by-side field comparison before every production deploy. The first production execution of any new flow must always be Quest-gated regardless of autonomy level.

4. **Scope matrix misconfiguration creates wrong records silently** — AppFolio accepts records with wrong vendor IDs or category assignments without complaint. The matrix must be validated at save time: schema validation, vendor ID existence check against AppFolio API, and Quest preview must surface full "Scope → Category → Vendor Name" so users can catch errors before approving. Validation is part of the Quest screen, not optional.

5. **Quest approval becomes a rubber-stamp click-through** — If the approval screen is information-dense and identical for every run, users learn to click Approve without reading. Structure the Quest screen with a scannable lead summary ("Creating 5 work orders on Unit 4B, 123 Main St"), visual callouts for unusual conditions, and keep the Approve button below the summary but above expanded detail. Track approval-to-review-time in logs — sub-5-second approvals signal the screen isn't being read.

---

## Implications for Roadmap

### Phase 1: Foundation + AppFolio Connectivity

**Rationale:** Nothing else is buildable without a validated connection to AppFolio and a working database schema. The adapter interface must be defined before any automation logic is written — this is the most important architectural decision and must be locked before Phase 2.

**Delivers:** Working AppFolio read operations (unit list), DB schema with migrations, scope matrix imported and queryable, environment switching (sandbox/prod), and the typed `AppFolioAdapter` interface with RestAdapter stub.

**Addresses:** Sandbox/production env switch (table stakes), scope matrix in DB, adapter pattern for PO gap

**Avoids:** PO API gap blocking later phases (resolve or plan Playwright fallback), business logic coupling to AppFolio API calls

**Research flag:** Needs concrete AppFolio API testing — unit eligibility rules, field requirements, actual rate limit behavior. Document findings in `docs/appfolio-field-notes.md`.

### Phase 2: Quest Engine + Approval Flow

**Rationale:** The Quest system is the trust mechanism and the product's core differentiator. It must be working end-to-end before any AppFolio writes occur. Build it without write operations first — the quest builder and state machine can be exercised entirely with read-only data.

**Delivers:** Quest builder (reads scope matrix, generates structured proposal), Quest persistence (state machine: PENDING → APPROVED/REJECTED → EXECUTING → COMPLETED/FAILED), Quest inbox UI, Approve/Reject actions, execution log with human-readable entries.

**Addresses:** Quest approval flow, quest inbox, execution log, approve/reject actions (all table stakes)

**Avoids:** Rubber-stamp approval design (tier the Quest screen correctly from the first implementation — habits form on first 20 uses), passive logging (failures must push to quest inbox, not wait to be discovered)

**Research flag:** Well-documented HITL patterns — no additional research needed. Apply StackAI and Orkes patterns from PITFALLS.md directly.

### Phase 3: Work Order Automation

**Rationale:** WO creation is the first write operation against AppFolio. It must be built after the Quest state machine is fully working, and validated entirely in sandbox before any production use. The idempotency wrapper (check-before-create) must exist before the first production WO is created.

**Delivers:** Work order creation via AppFolio API, pre-flight unit eligibility check, check-before-create idempotency on every WO write, Quest preview showing exact WOs that will be created, rollback manifest (created record IDs stored in DB).

**Addresses:** Work order creation (table stakes), pre-flight eligibility validation, idempotency

**Avoids:** Partial failure leaving AppFolio in corrupted state, duplicate WOs corrupting vendor PO matching, wrong unit/property selection (property-first selector enforced here)

**Research flag:** Unit eligibility rules need empirical discovery against the sandbox. Undocumented AppFolio rate limits need to be handled conservatively (5 req/15s ceiling).

### Phase 4: Purchase Order Automation

**Rationale:** POs depend on WOs (WOs must exist first). PO creation is the highest-risk item: the API path is unresolved and a browser automation fallback may be required. The adapter interface from Phase 1 means this phase can ship either implementation without touching business logic.

**Delivers:** PO creation via AppFolio API (or Playwright fallback if API gap is unresolved), PO grouping logic (one PO per vendor across all WOs for that vendor), Quest preview updated to show POs alongside WOs, Playwright fallback using ARIA-based selectors only (if needed).

**Addresses:** Purchase order creation (table stakes)

**Avoids:** Browser automation coupled to CSS selectors (ARIA-only from day one), PO creation being hard to swap between API and browser path

**Research flag:** HIGH priority — the PO API gap must be resolved or definitively closed before this phase begins. Check AppFolio support response. If no API path: build Playwright as primary behind the RestAdapter interface, document it as high-maintenance infrastructure.

### Phase 5: Hardening + Production Readiness

**Rationale:** The automation works. Now make it production-safe. Sandbox/production divergence means a deliberate promotion process is required. Error handling, retry logic, and autonomy dial infrastructure close the gap between "works in testing" and "trustworthy in production."

**Delivers:** Sandbox-to-production promotion checklist and field comparison process, rate-limit-aware request queue (5 req/15s ceiling, exponential backoff on 429/500, immediate surface on 4xx), autonomy dial data model and UI (Level 1 only active, but structure supports Levels 2-3), Quest expiry and escalation to quest inbox, active failure notifications (failures push to quest inbox as "Requires Action").

**Addresses:** Rate limiting, retry logic discrimination (4xx vs 5xx), sandbox/production promotion, autonomy dial infrastructure, quest expiry

**Avoids:** Autonomous graduation before trust is established, silent failures with no notification path, retrying non-retriable errors

**Research flag:** Standard patterns — no additional research needed for retry logic or rate limiting. Apply patterns from PITFALLS.md directly.

### Phase Ordering Rationale

- **DB and adapter first** because every other component depends on both. Building the Quest UI before the adapter interface exists is how you get business logic coupled to AppFolio calls.
- **Quest engine before writes** because the Quest state machine is the safety layer. Writing to AppFolio before it exists means the first production run has no human checkpoint.
- **WOs before POs** because AppFolio's own record hierarchy requires it (WOs must exist before POs referencing them).
- **PO path deferred to Phase 4** because it is blocked on an external dependency (AppFolio support response). Phases 1-3 can proceed in parallel with that investigation.
- **Hardening last** not because it is unimportant, but because the hardening tasks are informed by what the automation actually does — retry error codes and rate limit behavior are only known after Phases 3-4 are exercised in sandbox.

### Research Flags

**Needs deeper research or empirical discovery during implementation:**
- **Phase 1:** AppFolio API field requirements, unit eligibility rules, actual sandbox vs. production field differences. Discover empirically and document in `docs/appfolio-field-notes.md`.
- **Phase 4:** PO API path resolution. Binary outcome: confirmed API path or confirmed gap requiring Playwright. Must be resolved before Phase 4 begins.

**Standard patterns — skip research-phase:**
- **Phase 2:** Quest/HITL architecture is well-documented. Apply patterns directly.
- **Phase 3:** Idempotency, check-before-create, and state machine patterns are established. No new research needed.
- **Phase 5:** Rate limiting and retry logic patterns are fully documented. Apply directly.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified against official sources and release notes. Railway + pg-boss + Next.js pattern is well-understood individually; combined deployment confirmed via Railway documentation. |
| Features | MEDIUM-HIGH | AppFolio-specific features validated against AppFolio's own documentation. HITL approval patterns validated against production HITL systems (StackAI, Orkes). Feature prioritization reflects direct client requirements from PROJECT.md. |
| Architecture | HIGH | Adapter pattern, propose-commit HITL separation, and database-backed state machines are well-established patterns used in production systems. SQLite-vs-Postgres recommendation is well-supported for this scale profile. |
| Pitfalls | HIGH (AppFolio-specific) / MEDIUM (UX patterns) | Rate limits, sandbox/production divergence, and PO API gap are confirmed from AppFolio API documentation and project context. UX pitfalls (rubber-stamp, notification fatigue) are research-backed but require validation against actual user behavior. |

**Overall confidence:** HIGH for architecture and stack decisions. The single unresolved variable that could materially affect Phase 4 is the PO API gap — everything else is buildable with high confidence.

### Gaps to Address

- **PO creation API path (critical):** AppFolio support has been contacted but has not confirmed. This is the only item that could force a significant implementation pivot (REST to Playwright). The adapter interface isolates the blast radius, but the fallback implementation has higher maintenance cost. Resolve before Phase 4 planning.
- **AppFolio field-level production vs. sandbox differences:** These are not fully enumerable upfront — they are discovered during development. The `docs/appfolio-field-notes.md` document must be started in Phase 1 and maintained throughout. Treat it as living documentation, not a one-time exercise.
- **Unit eligibility rules:** AppFolio enforces server-side eligibility rules that are not fully documented. The pre-flight check in Phase 3 depends on knowing what these rules are. Discovery is empirical — the rules will be found by triggering 422 responses in sandbox and decoding the error messages.
- **AppFolio rate limits under automation load:** The known rate limit (7 req/15s on Reporting v2) may differ for write endpoints. Build conservatively (5 req/15s ceiling) and adjust after observing actual behavior in sandbox.

---

## Sources

### Primary (HIGH confidence)
- AppFolio Reporting v2 API Documentation — rate limits, pagination behavior, error codes
- AppFolio Work Order Best Practices — work order model, unit turn category structure
- AppFolio Unit Turns Guide — recommended unit turn workflow
- Auth.js v5 migration guide — Next.js App Router integration confirmed
- pg-boss v10 release notes — stately queues, dead-letter queue behavior
- StackAI: Human-in-the-Loop AI Agents — evidence pack design, propose-commit separation
- GitLab: Building Trust in Agentic Tools — phased autonomy trust-building patterns
- Trust in Automation Framework (ResearchGate) — error timing and trust erosion severity (academic)
- ByteByteGo: Mastering Idempotency — idempotency patterns for reliable APIs
- Project context: `.planning/PROJECT.md` — client constraints, PO API gap, scope matrix, autonomy roadmap

### Secondary (MEDIUM confidence)
- Railway vs. Fly.io vs. Vercel 2025 comparison — deployment platform capabilities
- Drizzle vs. Prisma 2025 — ORM tradeoff analysis
- Neon vs. Supabase comparison — database host selection
- AppWork Features and AppFolio Integration — competitive UX reference for work order portals
- Zapier: Human-in-the-Loop Patterns — HITL routing strategies
- Resolve: Top Automation Mistakes — anti-patterns reference

### Tertiary (LOW confidence — validate during implementation)
- Undocumented AppFolio rate limits on write endpoints — need empirical confirmation
- AppFolio sandbox/production field-level differences — need empirical discovery

---

*Research completed: 2026-04-01*
*Ready for roadmap: yes*
