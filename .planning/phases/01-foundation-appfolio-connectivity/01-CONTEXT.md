# Phase 1: Foundation + AppFolio Connectivity - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a working authenticated portal shell with login/logout, a fixed sidebar nav, a live AppFolio sandbox connectivity check surfaced on the dashboard, activity log database schema + write interface, and automation engine primitives (adapter interface, rate limiter, state machine scaffold). Phase 1 ends with the app deployed and accessible on Railway.

No AppFolio writes in Phase 1. No Quest UI. No multi-user management. Activity log UI display deferred to Phase 3.

</domain>

<decisions>
## Implementation Decisions

### User Provisioning
- **D-01:** Single user only in v1. Credentials supplied via `ADMIN_EMAIL` and `ADMIN_PASSWORD_HASH` environment variables. Auth.js bootstraps the account on first run. No seed scripts, no user management UI, no invite flow in Phase 1.
- **D-02:** All ~10 eventual team members are out of scope for Phase 1. User invite system is v2 (AUTH-V2-01).

### Session Policy
- **D-03:** Claude's discretion — user did not select this area. Default to Auth.js v5 standard session behavior: persistent session cookie, 30-day expiry, refreshed on activity. No "Remember me" toggle in Phase 1.

### Deployment
- **D-04:** Phase 1 is complete when the app is deployed to Railway and accessible in a browser. Milestone = live deploy, not just local passing tests.
- **D-05:** Railway project includes two services: (1) Next.js web app, (2) pg-boss worker process. Neon DB provisioned. GitHub Actions CI/CD wired. Environment variables configured in Railway dashboard.

### Activity Log Data Model
- **D-06:** Activity log table uses structured fields — not a plain-text blob. Schema must support the full Quest lifecycle: `request_type`, `inputs` (JSONB), `planned_actions` (JSONB), `expected_outputs` (JSONB), `status` (enum: pending | approved | rejected | completed | failed), `outcome_notes` (text), `created_at`, `updated_at`, `unit_id` (nullable), `scope_id` (nullable).
- **D-07:** In Phase 1, the only real log entries written are AppFolio connectivity check records — proving the schema and write path work before Phase 3 automation uses them. Status field used: `completed` or `failed`. No pending/approval flow in Phase 1.
- **D-08:** The log is a "job board for employees" — designed for non-technical users. Plain-language descriptions in `planned_actions` and `outcome_notes`. No stack traces or internal IDs surfaced to users.

### AppFolio Adapter Interface
- **D-09:** Claude's discretion — adapter interface design is a technical decision. The interface must satisfy ENGINE-03: business logic calls the adapter, never the HTTP layer directly. API and Playwright implementations are swappable. Start with API-only implementation; Playwright path deferred to Phase 5.

### Rate Limiting (ENGINE-01)
- **D-10:** Claude's discretion — conservative limit of ≤5 req/15s as specified. Queue/retry transparently; do not surface rate limit errors to users unless the queue grows beyond reasonable bounds (e.g., >30 second wait).

### Claude's Discretion
- Session expiry duration and cookie configuration
- Adapter interface signature (function-based vs. class-based)
- Rate limiter implementation approach (token bucket, sliding window, etc.)
- pg-boss worker startup and graceful shutdown behavior
- Drizzle schema file organization

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### UI Design Contract
- `.planning/phases/01-foundation-appfolio-connectivity/01-UI-SPEC.md` — Approved visual and interaction contract. Defines exact colors, typography, spacing, component inventory (shadcn/ui only), copywriting, and interaction states. Executor must run `npx shadcn@latest init` before writing UI code.

### Project & Stack
- `CLAUDE.md` — Full technology stack decisions, library versions, and project constraints. Source of truth for all technology choices.
- `.planning/REQUIREMENTS.md` — Phase 1 requirement definitions: AUTH-01–03, PORTAL-01, PORTAL-04, ENGINE-01–04, LOG-01.
- `.planning/ROADMAP.md` — Phase 1 goal, success criteria, and dependency map.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project. No existing components, hooks, or utilities.

### Established Patterns
- None yet — Phase 1 establishes the patterns all subsequent phases follow.

### Integration Points
- Phase 1 creates the integration points other phases connect to: AppFolio adapter interface, activity log write path, pg-boss worker, Auth.js session middleware.

</code_context>

<specifics>
## Specific Ideas

- The portal product name is "Turnkey" (from UI-SPEC copywriting contract). Browser tab: "Turnkey — 3Y Realty."
- Activity log is conceptually a "job board for employees" — designed for non-technical users who need to approve or review automation actions in plain language.
- Phase 1 ends with a Railway deploy, not just local passing tests — this is the explicit completion milestone.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-foundation-appfolio-connectivity*
*Context gathered: 2026-04-01*
