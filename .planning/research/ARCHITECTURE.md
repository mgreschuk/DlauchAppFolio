# Architecture Patterns

**Project:** AppFolio Automation Platform — DLauch Client Portal
**Researched:** 2026-04-01
**Confidence:** HIGH (patterns well-established; AppFolio-specific gaps noted)

---

## Component Overview

The system has five distinct layers. Each has a clear owner and communicates with adjacent layers only — no layer skips.

```
┌─────────────────────────────────────────────────────────┐
│                    Portal UI (React)                     │
│   Scope selector · Quest inbox · Activity log · Home    │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP (REST or Server Actions)
┌────────────────────────▼────────────────────────────────┐
│                   API Layer (Next.js)                    │
│   Route handlers · Auth middleware · Request validation  │
└────────────────────────┬────────────────────────────────┘
                         │ Function calls
┌────────────────────────▼────────────────────────────────┐
│              Automation Engine (Node.js)                 │
│   Quest builder · Execution runner · Sequence logic      │
└──────────┬──────────────────────────┬───────────────────┘
           │                          │
┌──────────▼──────────┐   ┌──────────▼──────────────────┐
│   AppFolio Client   │   │      Data Store (SQLite)      │
│  (Adapter Pattern)  │   │  Quests · Logs · Matrix       │
│  API ↔ Playwright   │   └──────────────────────────────┘
└─────────────────────┘
```

### Component Boundaries

| Component | Responsibility | Communicates With | Owns |
|-----------|---------------|-------------------|------|
| **Portal UI** | User-facing interface: scope selection, quest review, activity log | API Layer only | No business logic, no direct DB access |
| **API Layer** | HTTP boundary: auth, request parsing, response shaping, routing to engine | Portal UI (inbound), Automation Engine (outbound) | Session handling, input validation |
| **Automation Engine** | All business logic: builds quests, executes sequences, manages state transitions | API Layer (inbound), AppFolio Client (outbound), Data Store (read/write) | Sequence definitions, quest lifecycle, execution rules |
| **AppFolio Client** | Single interface for all AppFolio operations, regardless of implementation | Automation Engine only | Adapter registration, method routing |
| **Data Store** | Persistent state: quest queue, execution logs, scope matrix | Automation Engine only (API Layer reads logs via engine methods) |  Schema migrations |

---

## Data Flow

### Unit Turn Automation — Happy Path

```
User selects unit + scopes → [Portal UI]
  → POST /api/automations/unit-turn/preview → [API Layer]
    → Engine: buildQuest(unit, scopes) → [Automation Engine]
      → reads scope matrix → [Data Store]
      → returns structured Quest object
    → API returns Quest to UI
  → UI renders Quest for review
User approves → POST /api/quests/:id/approve → [API Layer]
  → Engine: executeQuest(questId) → [Automation Engine]
    → AppFolioClient.createWorkOrder(…) → [AppFolio Client]
      → REST API call → AppFolio
      → (fallback: Playwright session) → AppFolio UI
    → AppFolioClient.createPurchaseOrder(…) → [AppFolio Client]
    → Engine writes execution log → [Data Store]
  → API returns execution summary to UI
  → UI updates activity log
```

### Quest Lifecycle State Machine

```
PENDING (proposed, awaiting approval)
  → APPROVED (user clicked approve)
      → EXECUTING (engine picked up)
          → COMPLETED (all steps succeeded)
          → FAILED (step errored, logged)
  → REJECTED (user cancelled)
  → EXPIRED (never acted on, timed out)
```

Quests are persisted at creation. Every state transition is written to the log. This means the quest queue survives server restarts and every human decision is auditable.

### Scope Matrix Data Flow

```
Spreadsheet (client provides) → Import/seed script → scope_matrix table (SQLite)
  ← read by Engine at quest-build time
  ← read/edited via admin UI (future)
```

The matrix is the single source of truth for: scope name → unit turn category → preferred vendor → default inputs (duration, description template, etc.). Engine never hardcodes these values.

---

## Key Architectural Decisions

### Decision 1: Adapter Pattern for AppFolio Client

**What:** Define a typed `AppFolioAdapter` interface. Implement it twice: `RestAdapter` (HTTP calls) and `PlaywrightAdapter` (browser automation). The engine calls the interface — never a concrete implementation directly.

**Why:** AppFolio API has a known gap for purchase orders. The PO creation path is unresolved. Building to an interface means PO creation can ship as Playwright today and be swapped to REST the moment the API path is confirmed — with zero changes to business logic.

**Interface shape:**
```typescript
interface AppFolioAdapter {
  getUnits(): Promise<Unit[]>
  createWorkOrder(params: WorkOrderParams): Promise<WorkOrderResult>
  createPurchaseOrder(params: PurchaseOrderParams): Promise<PurchaseOrderResult>
}
```

The active adapter is selected at startup via environment config (`APPFOLIO_ADAPTER=rest|playwright`) or per-method if methods need different adapters during the transition period.

**Confidence:** HIGH — adapter pattern for vendor abstraction is well-established in TypeScript backends.

---

### Decision 2: Automation Sequences as Plain Async Functions, Not a Workflow Engine

**What:** Each automation sequence (e.g., "unit turn") is a TypeScript async function that calls engine primitives in order. No external workflow engine (Temporal, Inngest, Bull, etc.).

**Why:** The scale doesn't justify it. Ten users, sequential steps, no parallelism requirements, no fan-out. A workflow engine adds infrastructure complexity and learning curve that a solo consultant building for ~10 users doesn't need.

The "durability" problem (server restart mid-execution) is solved by persisting quest state before each step, not by a workflow engine. If a step fails mid-run, the quest record shows exactly where it was.

**Step structure:**
```
async function executeUnitTurnQuest(quest: Quest): Promise<ExecutionResult> {
  for (const step of quest.steps) {
    await updateQuestStep(quest.id, step.id, 'executing')
    const result = await executeStep(step)
    await logStepResult(quest.id, step.id, result)
    if (!result.ok) throw new ExecutionError(step, result)
  }
}
```

**When to revisit:** If automations grow to have parallel branches, long delays, or external callbacks (e.g., "wait for vendor to confirm"), migrate to Inngest or Temporal at that point. The sequence functions are small enough to rewrite.

**Confidence:** HIGH for this scale. MEDIUM if future automations need fan-out or wait states.

---

### Decision 3: Quest/Approval Flow as a Database-Backed State Machine

**What:** Quests live in a `quests` table with a `status` column (see state machine above). Each step lives in a `quest_steps` table. The engine reads, updates, and progresses quest state. The UI polls or uses SSE for live updates.

**Why the "propose-commit" split matters:** The separation between "engine builds the plan" and "engine executes the plan" is the foundational safety guarantee. A quest that has been proposed but not approved cannot execute — this is enforced at the data layer (status check before execute), not just the UI.

**Quest record schema (conceptual):**
```
quests
  id, status, automation_type, created_by, created_at, approved_at, approved_by,
  executed_at, summary_json (what was heard / how interpreted / what will happen)

quest_steps
  id, quest_id, step_order, step_type, input_json, output_json, status, executed_at, error_message
```

`summary_json` is the human-readable "what the automation heard / plans to do" blob shown in the Quest inbox. It is written at quest creation and never mutated after approval — it is a snapshot of the plan.

**Confidence:** HIGH — this pattern is used by production HITL systems (Orkes, LangGraph, Bedrock Agents all follow propose-commit separation).

---

### Decision 4: Scope Matrix in Database Table, Seeded from Spreadsheet

**What:** The scope-to-category-to-vendor mapping lives in a `scope_matrix` table in SQLite, not in a config file or hardcoded object. A one-time seed script imports the client's spreadsheet. Future edits happen via admin UI or direct DB edit.

**Why database over config file:**
- The client needs to add/edit scopes without a developer touching code or deploying
- Relational queries let you ask "what vendors are active for scope X" easily
- Config files are fine for developer settings; user-editable business data belongs in the DB

**Why not a separate config service or external store:**
- At this scale (10 users, single-node deployment), SQLite is appropriate — no separate server, no connection pooling, file-based backup
- Complexity budget: a separate config service is overkill

**Schema (conceptual):**
```
scope_matrix
  id, scope_name, unit_turn_category, preferred_vendor_id, default_description_template,
  default_duration_days, active, notes

vendors
  id, name, appfolio_vendor_id, contact_email, active
```

**Confidence:** HIGH for the DB-over-config-file decision for editable business data. MEDIUM for exact schema — will need adjustment once AppFolio's required work order fields are fully known.

---

### Decision 5: SQLite as the Data Store (Not PostgreSQL)

**What:** One SQLite file, accessed by the Node.js backend via `better-sqlite3`. No separate database server.

**Why:**
- ~10 concurrent users, mostly sequential reads/writes
- No horizontal scaling requirement
- Zero operational overhead — no Docker container to manage, no connection strings, file-level backup is `cp app.db app.db.bak`
- `better-sqlite3` is synchronous and fast for this workload
- Simple deployment: the entire application is one Node process + one file

**When to migrate:** If the client grows beyond ~50 users, or concurrent write volume increases (e.g., automation webhooks from AppFolio firing simultaneously), migrate to PostgreSQL. The schema is standard relational — migration is straightforward.

**Confidence:** HIGH for this scale/team profile. Well-supported by community consensus for small internal tools.

---

### Decision 6: Next.js as the Full-Stack Framework

**What:** Next.js (App Router) for both the React frontend and the API layer. Server Actions for internal mutations. Route handlers (`/app/api/...`) for webhook endpoints and any external-facing surfaces.

**Why:**
- Single framework, single deployment — appropriate for a solo consultant maintaining this long-term
- App Router Server Components reduce client-side complexity for data-heavy views (activity log, quest inbox)
- Server Actions simplify form/mutation flows without building a separate REST API for internal UI operations
- Well-documented, stable, strong ecosystem

**What lives where:**
- UI components and pages: `app/` (React Server Components + Client Components where needed)
- Automation engine: `lib/engine/` — pure TypeScript, no Next.js dependency, testable in isolation
- AppFolio client adapters: `lib/appfolio/` — interface + two implementations
- Database access: `lib/db/` — query functions only, no business logic
- API routes: `app/api/` — thin handlers that call engine functions

This structure means the automation engine can be tested without Next.js, and the AppFolio adapter can be swapped without touching the engine.

**Confidence:** HIGH for Next.js as the framework. MEDIUM for Server Actions vs. traditional API routes for all mutations — validate during Phase 1 development.

---

### Decision 7: Environment Switching (Sandbox vs. Production)

**What:** The AppFolio client reads its base URL and API key from environment variables. Switching environments is a config change, not a code change.

```
APPFOLIO_ENV=sandbox | production
APPFOLIO_SANDBOX_API_KEY=...
APPFOLIO_PRODUCTION_API_KEY=...
APPFOLIO_ADAPTER=rest | playwright
```

The UI shows a visible banner when the backend is pointed at sandbox. This prevents accidental production execution during development.

**Why this matters:** Sandbox and production AppFolio environments have known discrepancies. All automation development runs against sandbox. Promotion to production requires an explicit environment variable change + banner acknowledgment — it should be intentional.

**Confidence:** HIGH — standard pattern for API-integrated tools.

---

## Build Order

Components have hard dependencies that determine build sequence. The engine cannot run without the adapter interface. The UI cannot show quests without the quest data model.

```
Phase 1 — Foundation (nothing depends on these being in production)
  1. Data store schema + migrations
     └── All other components read/write here; define it first
  2. AppFolio Client — RestAdapter (read-only methods first: getUnits)
     └── Validates API connectivity and credentials before building on top of it
  3. Scope matrix import + seed script
     └── Engine needs matrix data to build quests

Phase 2 — Engine Core
  4. Quest builder (builds quest objects from unit + scope selections, reads matrix)
     └── No UI needed to test — unit-testable with fixtures
  5. Quest persistence (write quest to DB, read it back, transition status)
     └── Proves the state machine before the UI exists
  6. Execution runner (executes quest steps, writes logs)
     └── Can be invoked from a test script before the UI is built

Phase 3 — AppFolio Write Operations
  7. Work order creation (RestAdapter.createWorkOrder)
     └── Test against sandbox first; block production until validated
  8. Purchase order creation (RestAdapter or PlaywrightAdapter — TBD on API gap resolution)
     └── Blocked on AppFolio support response re: PO API availability

Phase 4 — Portal UI
  9. API routes (thin wrappers over engine functions)
     └── Engine must be complete before routes are meaningful
  10. Quest inbox UI (display pending quests, approve/reject)
      └── Core UX flow; most user-visible feature
  11. Scope selector + unit picker UI (triggers quest creation)
      └── Input side of the quest flow
  12. Activity log UI (execution history, human-readable)
      └── Can be built last; read-only, no business logic impact

Phase 5 — Hardening
  13. Sandbox/production environment banner + guardrails
  14. Error handling, retry logic in execution runner
  15. Auth (if multi-user session management needed beyond Phase 1)
```

**Critical path:** Data store → Adapter interface → Quest builder → Execution runner. The UI is the last thing built, not the first. This sequencing means every component is testable before the UI is wired up.

**Blocked item:** Purchase order creation (step 8) is blocked on AppFolio API gap resolution. The adapter interface accommodates this — the `createPurchaseOrder` method can be implemented as a stub or Playwright fallback while the API path is confirmed.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Business Logic in API Routes

Route handlers should be thin: parse request, call engine function, return response. If an API route contains conditional logic about how to create a work order, that logic is in the wrong place. It belongs in the engine, where it can be tested and reused.

### Anti-Pattern 2: Direct AppFolio API Calls Outside the Adapter

If any code outside `lib/appfolio/` makes HTTP calls to AppFolio, the adapter boundary is broken. This makes it impossible to swap implementations and harder to track what the system is doing to AppFolio data.

### Anti-Pattern 3: Hardcoding Scope/Vendor Relationships in Engine Code

The scope matrix belongs in the database. If vendor assignments or category mappings appear as constants or switch statements in engine code, the client cannot update them without a deployment.

### Anti-Pattern 4: Mutating Quest Summary After Approval

The `summary_json` on a quest is a snapshot of what the automation promised to do. After approval, this field must not be updated — the audit trail depends on it matching what the user saw and approved.

### Anti-Pattern 5: Mixing Sandbox and Production Credentials

The adapter should refuse to operate if `APPFOLIO_ENV` is not explicitly set. No defaulting to production. Fail loud on misconfiguration.

---

## Scalability Notes

This architecture is intentionally sized for ~10 users. Future growth paths that don't require rebuilds:

| Concern | At 10 users (now) | At 50+ users | At 500+ users |
|---------|------------------|--------------|---------------|
| Database | SQLite, single file | PostgreSQL, same schema | PostgreSQL + read replicas |
| Automation sequences | Sync functions, single process | Same, or add BullMQ for background queuing | Dedicated worker processes |
| AppFolio adapter | Single Node process | Same | Consider rate limiting, connection pooling |
| Quest approvals | Polling or SSE | SSE or WebSockets | WebSockets + push notifications |
| Deployment | Single Node + SQLite file | Docker + managed Postgres | Kubernetes (probably never needed for this product) |

---

## Sources

- [Adapter Pattern for Vendor Abstraction — Medium/ITNEXT](https://itnext.io/the-adapter-pattern-in-typescript-c0fdb33183a5)
- [Harnessing Adapter Pattern in Microservice Architectures](https://medium.com/@jescrich_57703/harnessing-the-adapter-pattern-in-microservice-architectures-for-vendor-agnosticism-debc21d2fe21)
- [Human-in-the-Loop Architecture: When Humans Approve Agent Decisions](https://www.agentpatterns.tech/en/architecture/human-in-the-loop-architecture)
- [StackAI: Human-in-the-Loop AI Agents — Approval Workflow Design](https://www.stackai.com/insights/human-in-the-loop-ai-agents-how-to-design-approval-workflows-for-safe-and-scalable-automation)
- [Human-in-the-Loop Patterns — Orkes](https://orkes.io/blog/human-in-the-loop/)
- [Inngest: How Durable Workflow Engines Work](https://www.inngest.com/blog/how-durable-workflow-engines-work)
- [PostgreSQL vs SQLite — SelectHub](https://www.selecthub.com/relational-database-solutions/postgresql-vs-sqlite/)
- [SQLite in Node.js — OneUptime](https://oneuptime.com/blog/post/2026-02-02-sqlite-nodejs/view)
- [Modern Full-Stack Architecture with Next.js 15+](https://softwaremill.com/modern-full-stack-application-architecture-using-next-js-15/)
- [Database Design for Audit Logging — Red Gate](https://www.red-gate.com/blog/database-design-for-audit-logging/)
- [Guide to Building Audit Logs — Medium/Infisical](https://medium.com/@tony.infisical/guide-to-building-audit-logs-for-application-software-b0083bb58604)
