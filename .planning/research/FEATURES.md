# Feature Landscape

**Domain:** Property management automation / operations portal (AppFolio-integrated)
**Researched:** 2026-04-01
**Confidence:** MEDIUM-HIGH (direct AppFolio ecosystem research + HITL automation pattern research)

---

## Table Stakes

Features users expect from any internal operations portal in this space. Missing = the product
feels broken, unfinished, or untrustworthy.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Automation trigger UI | Primary reason the tool exists — without it users revert to manual AppFolio | Low | Unit selector + scope picker + Go button. Phase 1 core. |
| Action preview before execution | Data-integrity concern is client's #1 stated priority. No preview = no trust. | Medium | The "Quest" pattern. Show what will happen, why, with what inputs, before a single API call fires. |
| Approval inbox (quest inbox) | Without a dedicated review surface, approvals devolve into emails or Slack noise | Medium | Structured queue: pending quests, sorted by recency/urgency. Each quest shows full evidence pack. |
| Execution log (activity history) | Required for debugging, accountability, and operator confidence. Industry-standard in every comparable tool (AppWork, AvidXchange, Buildium). | Low-Medium | Persistent, human-readable, timestamped. Every automation run logged with inputs, outputs, status, and who approved. |
| Approve / Reject / Edit actions on quests | Approve-only flow forces restarts when input is slightly wrong. Users abandon or rubber-stamp. | Low | Minimum: Approve, Reject with reason. Target: Approve with edits (modify inputs inline). |
| Configurable scope matrix | Client explicitly requires: add/edit scopes without a developer. Hardcoded = perpetual dev dependency. | Medium | Editable mapping table: scope → unit turn category → preferred vendor. Lives in admin config, not code. |
| Scope-to-category-to-vendor routing | Core automation logic. Without this, every unit turn requires manual vendor selection. | Medium | Driven entirely by scope matrix. Automation reads matrix, not hardcoded logic. |
| Work order creation per category | AppFolio's own model: one WO per unit turn category. Deviating breaks reporting. | Medium | One WO per scope category, correct category assignment, correct unit linkage. |
| Purchase order creation per vendor | POs are the external vendor-facing document. Vendors need PO numbers to invoice. | High | Highest risk item — PO creation path in AppFolio API is undocumented. Requires API resolution or browser automation fallback. |
| Sandbox vs. production environment toggle | Sandbox/production diverge on AppFolio. All development and testing requires sandbox first. | Low | Config-level switch. Automations should not need code changes to target sandbox vs. prod. |
| Multi-user access | Owner + team of ~10. Single-login tool is unacceptable for team operations. | Low-Medium | Auth required. Role distinction: owner vs. team member at minimum. Not enterprise RBAC. |
| Portal home / navigation | Entry point for all automation tools. Without structure, the tool doesn't scale past 1 automation. | Low | Simple nav: Home, Unit Turns, Quest Inbox, Activity Log, Settings. Extensible for future automations. |

---

## Differentiators

Features that distinguish this product from both raw AppFolio and generic automation tools.
Not expected by default, but meaningfully valuable when present.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Quest evidence pack (not just approve/reject) | Most HITL systems show minimal context and get rubber-stamped. A full evidence pack — what was heard, how it was interpreted, what inputs were resolved, what will execute — builds genuine operator trust. Reduces decision time from minutes to seconds. | Medium | Per StackAI HITL research: reviewer's job is to verify, not redo. Evidence pack is the key to fast, high-quality approvals. |
| Autonomy dial per automation type | The project's stated phased autonomy roadmap is only achievable if autonomy level is a first-class setting, not a code change. Operators can tune: always-approve, auto-approve-simple/approve-complex, fully-autonomous. | Medium-High | Design from day 1. Even if all automations start at Stage 1 (always-approve), the data model and routing logic must support stages 2 and 3 without a rebuild. |
| Idempotency + pre-condition validation at commit time | Standard HITL anti-pattern: quest is approved, system state has changed, automation fires anyway and creates duplicates. Prevention: re-validate AppFolio state before executing after approval. | Medium | Not visible to users but prevents a category of support escalations. Flag as non-obvious architectural requirement. |
| Human-readable automation rationale in log | Most execution logs are technical (API request/response dumps). Layman-readable rationale — "Created WO for Paint category, assigned to ABC Painters because they are the mapped vendor for Paint scope" — removes the need for users to decode logs. | Low-Medium | Requires intentional log message design in automation code, not just raw data capture. |
| Approve with edits (inline quest modification) | Forces user to restart quest if an input is wrong. Inline editing — change a vendor, adjust a PO amount, swap a category — eliminates restarts and builds confidence in the automation's suggestions. | Medium | Treat quest inputs as editable drafts, not immutable proposals. |
| Scope matrix UI (non-developer editable) | External tools (spreadsheets, CSVs) require developer intervention to sync. An in-portal admin UI for the scope matrix turns a configuration artifact into a self-serve capability. | Medium | Spreadsheet-to-table migration. CRUD interface with validation. Critical for long-term independence from developer. |
| Per-automation sandbox testing mode | Lets operators run the full automation flow against AppFolio sandbox from within the production portal, without switching environments or credentials manually. | Low-Medium | A testing toggle per automation run, not just a global env switch. |
| Quest expiry + escalation | Stale quests left unanswered cause downstream problems (vendors waiting, units not turning). Auto-expiry with notification + escalation to owner closes the loop. | Low-Medium | Simple timer-based escalation. Not a blocker for Phase 1 but important before real team usage. |
| Audit trail with diff view | Standard logs show what happened. A diff view — AppFolio state before vs. after the automation — makes rollback planning possible and builds client trust. | High | Deferred: complex to implement cleanly. Flag for Phase 2+. |

---

## Anti-Features

Features to deliberately not build, with rationale. These are traps that waste time, add fragility,
or violate stated constraints.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Browser/UI automation for AppFolio (general) | Brittle, breaks on UI changes, maintenance burden exceeds value. AppFolio UI has already diverged between sandbox and production. | API-first always. Browser automation is a last-resort fallback only for PO creation if API path is definitively closed. Encapsulate in a swappable adapter. |
| Mobile app | Explicitly out of scope. ~10 users, internal tool, web portal is sufficient. Building mobile adds platform complexity with no validated demand. | Responsive web design covers occasional mobile access without a native app. |
| Multi-tenant / SaaS architecture | This is a single-client internal tool. Multi-tenancy adds auth complexity, data isolation requirements, and billing machinery that provides zero value here. | Build for one tenant cleanly. Do not introduce tenant_id or org-scoping anywhere unless the client relationship explicitly changes. |
| Real-time push notifications (native) | Overkill for a ~10-user async workflow tool. Push notification infrastructure (WebSockets, push tokens) adds complexity and ops burden. | Email or in-portal notification badge on quest inbox. Simple polling or SSE acceptable for live updates. |
| Full AppFolio accounting replacement | The tool augments AppFolio, it does not replace it. Building general ledger, AR/AP, or lease management duplicates AppFolio's purpose and creates two sources of truth. | Narrow scope: automate specific AppFolio record creation/management tasks. All financial truth lives in AppFolio. |
| Generic workflow builder (drag-and-drop) | Tempting to build a "platform" but the value is in the specific automations, not a generic engine. A configurable workflow builder adds months of work and may never be used. | Build specific automations well. Extract shared patterns into internal libraries once 2-3 automations prove the pattern. |
| Role-based access control (RBAC) beyond owner/team | Enterprise RBAC (custom roles, permission matrices, row-level security) is engineering overhead for a 10-user tool where the owner trusts their team. | Two roles: Owner (full access including settings) and Team Member (can trigger automations, view log, action quests). No more until validated need. |
| Tenant / resident-facing portal | This is an operations tool for the property management team, not a tenant portal. AppFolio already provides tenant-facing functionality. | Keep the portal strictly internal. Never expose automation controls to tenants. |
| AI/LLM for scope interpretation | Tempting to let an LLM map freeform scope descriptions to categories/vendors. Adds latency, cost, and unpredictability for a use case where a deterministic matrix works correctly 100% of the time. | Use the scope matrix as the single source of truth. LLM is not needed here — the matrix already encodes all mapping logic. |
| Dashboards and analytics (Phase 1) | Reporting and trend analysis is future milestone scope (utility expense tracking, QBO bridge). Building analytics infrastructure before the core automation works is premature. | Log everything. Analytics can be built on top of logs later. Don't build a BI layer in Phase 1. |

---

## Feature Dependencies

```
Scope Matrix (config) → Scope Picker UI → Quest Generation → Quest Inbox → Approval
                                                                              ↓
                                                                       Automation Execution
                                                                              ↓
                                                                       Execution Log Entry

Work Order Creation ← (depends on) → AppFolio API auth + sandbox/prod env switch
Purchase Order Creation ← (depends on) → Work Order Creation (WOs must exist first)
                                       → API path resolution (PO creation gap must be resolved)

Approve with Edits ← (depends on) → Quest evidence pack (need data model for editable fields)
Autonomy Dial ← (depends on) → Quest routing logic (must exist before autonomy levels work)
Quest Expiry ← (depends on) → Quest Inbox (must exist first)
```

---

## MVP Recommendation

**Phase 1 priority (must ship to deliver any value):**

1. Scope picker + unit selector UI — no automation without inputs
2. Quest evidence pack + approval flow — trust before autonomy
3. Work order creation via AppFolio API — core automation
4. Purchase order creation — critical path, resolve API gap first
5. Execution log — accountability from day one
6. Scope matrix config (admin-editable) — client independence from developer

**Phase 1 defer (valuable, not blocking):**

- Approve with edits (approve/reject covers Phase 1, edits are polish)
- Quest expiry / escalation (team is small, manual follow-up is acceptable early)
- Autonomy dial (all automations start at Stage 1; build the data model, expose the UI later)
- Per-automation sandbox testing mode (global sandbox toggle covers Phase 1)

**Phase 2+ (explicitly scoped but not planned):**

- Payables automation (bill creation, invoice reconciliation)
- Utility expense tracking
- QBO bridge
- Audit trail diff view
- Analytics / reporting

---

## Sources

- [AppWork Features](https://appworkco.com/features/) — Competitive reference for work order portal UX patterns (MEDIUM confidence)
- [AppWork + AppFolio Integration](https://appworkco.com/press-releases/appwork-launches-new-integration-with-appfolio-october-13th-2025/) — Two-way sync pattern, make-ready board (MEDIUM confidence)
- [AppFolio Unit Turns Guide](https://www.appfolio.com/blog/streamline-unit-turns/) — AppFolio's own recommended unit turn workflow (HIGH confidence)
- [AppFolio Work Order Best Practices](https://www.appfolio.com/blog/maximizing-work-orders-in-appfolio-to-save-time-and-stay-compliant/) — Work order model reference (HIGH confidence)
- [StackAI: Human-in-the-Loop Approval Workflows](https://www.stackai.com/insights/human-in-the-loop-ai-agents-how-to-design-approval-workflows-for-safe-and-scalable-automation) — Evidence pack design, propose-commit separation, rubber-stamp prevention (HIGH confidence)
- [Zapier: Human-in-the-Loop Patterns](https://zapier.com/blog/human-in-the-loop/) — HITL levels and routing strategies (MEDIUM confidence)
- [Resolve: Top Automation Mistakes](https://resolve.io/blog/top-automation-mistakes) — Anti-pattern: portal without engine, over-abstraction (MEDIUM confidence)
- [Buildium: Workflow Automation](https://www.buildium.com/blog/property-management-workflow-automation/) — Industry baseline for PM automation features (MEDIUM confidence)
- [Propmodo: Autonomous Buildings and the Human Factor](https://propmodo.com/autonomous-buildings-and-the-human-factor/) — Phased autonomy approach in PM context (MEDIUM confidence)
- [AppFolio Stack Marketplace](https://www.appfolio.com/stack) — Third-party integration ecosystem context (HIGH confidence)
