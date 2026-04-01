# Phase 1: Foundation + AppFolio Connectivity - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Downstream agents read CONTEXT.md, not this file.

**Date:** 2026-04-01
**Phase:** 1 — Foundation + AppFolio Connectivity

---

## Areas Discussed

User selected: User Provisioning, Phase 1 Deployment Scope, Activity Log Scope.
User skipped: Session Policy.

---

## User Provisioning

**Q:** How should the ~10 fixed users be created in v1? (Seed script / ENV-based bootstrap / Manual DB inserts)

**A (free text):** "I don't think this is the concern for v1, it can all be one user as long as there is some password protection, simple as that."

**Captured decision:** Single user, ENV-based credentials (`ADMIN_EMAIL` + `ADMIN_PASSWORD_HASH`). No seed script, no user management UI.

---

## Phase 1 Deployment Scope

**Q:** What counts as Phase 1 "done"? (Deployed to Railway / Local dev only)

**A:** Deployed to Railway (Recommended)

**Captured decision:** Phase 1 milestone = live app on Railway with Neon DB provisioned, GitHub Actions CI/CD, env vars configured.

---

## Activity Log Scope

**Q (initial):** What should Phase 1 write to the activity log? (Connectivity checks / Nothing yet / Login+logout events)

**A (free text, extended):** User clarified the concept — described the activity log as a "message board for employees" showing: (1) a simple approval request with inputs, planned actions, expected outputs; (2) an approval decision; (3) a completion/failure record with brief context. Not a technical server log. Designed for non-technical users.

**Clarifying Q:** Does this match: each log entry holds (1) approval request details, (2) approval decision, (3) outcome? (Structured fields / Plain-text blob)

**A:** Yes, structured fields (Recommended)

**Captured decision:** Activity log table uses JSONB structured fields (`inputs`, `planned_actions`, `expected_outputs`) + status enum + `outcome_notes`. Phase 1 creates schema + write path; writes connectivity check records to prove the path works. Quest UI in Phase 3 reads and displays these records.

---

## Areas Not Discussed (Claude's Discretion)

- **Session policy** — user did not select. Defaulting to Auth.js v5 standard 30-day persistent session.
- **Adapter interface design** — technical decision, user deferred.
- **Rate limiter implementation** — technical decision, user deferred.

---

*Discussion log created: 2026-04-01*
