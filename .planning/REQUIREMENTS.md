# Requirements: AppFolio Automation Platform — DLauch Client Portal

**Defined:** 2026-04-01
**Core Value:** A user selects what they want done, clicks Go, and it happens — with full transparency into what the automation did and why.

## v1 Requirements

### Authentication

- [ ] **AUTH-01**: User can log in with email and password
- [ ] **AUTH-02**: User session persists across browser refresh (stay logged in)
- [ ] **AUTH-03**: User can log out from any page

### Portal Shell

- [ ] **PORTAL-01**: User can navigate to dashboard home from any page
- [ ] **PORTAL-02**: User can access Quest inbox to view and act on pending approvals
- [ ] **PORTAL-03**: User can access Activity Log to review full automation history
- [ ] **PORTAL-04**: User can navigate to the Unit Turn automation tool from the dashboard

### Quest / Approval Flow

- [ ] **QUEST-01**: Before executing, system presents a Quest showing: what request was received, how it was interpreted, what it plans to do, what inputs will be used, and expected output — all in plain language
- [ ] **QUEST-02**: User can approve a Quest to trigger execution
- [ ] **QUEST-03**: User can reject a Quest to cancel execution without any AppFolio changes
- [ ] **QUEST-04**: After execution completes, Quest updates with the actual outcome (success, failure, records created, any errors)

### Unit Turn Automation

- [ ] **UNIT-01**: User can select a target unit from the AppFolio unit list
- [ ] **UNIT-02**: User can select one or more scopes to include in the unit turn
- [ ] **UNIT-03**: User can click Go to trigger the full automation sequence (generates a Quest for approval)
- [ ] **UNIT-04**: System creates one work order per unit turn category in AppFolio, populated with the correct vendor and description from the scope matrix
- [ ] **UNIT-05**: System creates one purchase order per vendor in AppFolio, grouping all work orders for that vendor under a single PO *(implementation path TBD — API route pending AppFolio support response; Playwright fallback if API unavailable)*

### Scope Matrix

- [ ] **MATRIX-01**: Admin can view the full scope-to-category-to-vendor matrix in the portal
- [ ] **MATRIX-02**: Admin can add a new scope entry (scope name, unit turn category, preferred vendor, work description)
- [ ] **MATRIX-03**: Admin can edit an existing scope's category, vendor, or description
- [ ] **MATRIX-04**: Admin can deactivate a scope (hides from unit turn UI without deleting history)

### Automation Engine

- [ ] **ENGINE-01**: AppFolio API client enforces rate limiting (≤5 req/15s conservative limit, adjustable from observed behavior; documented limit is 7)
- [ ] **ENGINE-02**: Before creating any record, system checks AppFolio for duplicates (idempotency — prevents double work orders/POs)
- [ ] **ENGINE-03**: System uses an adapter interface that separates business logic from execution path — API and browser automation are swappable at the adapter level without changing automation code
- [ ] **ENGINE-04**: Automation sequences use a step-level state machine — partial failures are recoverable without leaving AppFolio in a corrupt state

### Activity Log

- [ ] **LOG-01**: Every automation action (start, each step, completion, failure) is written to the activity log in plain, human-readable language
- [ ] **LOG-02**: User can view the activity log with entries listed in reverse-chronological order
- [ ] **LOG-03**: Each log entry shows the action taken, the unit/scope involved, timestamp, and success/failure status

---

## v2 Requirements

### Authentication & Access

- **AUTH-V2-01**: Admin can invite users via email link (no open registration)
- **AUTH-V2-02**: Role-based access — owner can edit scope matrix and manage users; team members can trigger automations and view logs
- **AUTH-V2-03**: Two-factor authentication

### Portal Experience

- **PORTAL-V2-01**: Dark/light mode toggle
- **PORTAL-V2-02**: Email or SMS notification when a Quest is waiting for approval
- **PORTAL-V2-03**: Quest expiry — if unapproved after X time, escalate or auto-cancel with notification

### Unit Turn

- **UNIT-V2-01**: Batch mode — trigger unit turns for multiple units in a single session
- **UNIT-V2-02**: Per-work-order status tracking visible in portal (pending, in progress, invoiced, closed)

### Payables Automation

- **PAY-V2-01**: System creates a bill in AppFolio from an incoming invoice (email forwarding via AppFolio SmartBill)
- **PAY-V2-02**: System fetches invoices not directly sent and creates bills in AppFolio
- **PAY-V2-03**: System imports expense transactions from bank accounts and credit cards
- **PAY-V2-04**: System reconciles bills against expense transactions
- **PAY-V2-05**: Bills contain required fields: vendor, description/line items, GL account, cash account, reference numbers, attached files
- **PAY-V2-06**: Parent Co → property entity expense allocation using rule-based logic
- **PAY-V2-07**: QBO bridge for Parent Co transactions that need to reflect in AppFolio entities

### Utility Expense Tracking

- **UTIL-V2-01**: System scrapes billing data from 5+ utility provider websites
- **UTIL-V2-02**: User can view utility expense trends vs. prior periods and vs. other units

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Browser/UI automation for AppFolio (general) | Brittle — breaks when AppFolio updates UI; API is preferred for all tasks. Exception: PO creation only if confirmed API gap |
| LLM for scope interpretation | Deterministic matrix is more reliable and auditable for a closed mapping problem |
| Mobile app | Web portal only for v1 |
| Multi-tenant SaaS | Internal tool for one client — no enterprise auth, no tenant isolation needed |
| More than ~10 users | No enterprise scale required; simple auth is sufficient |
| Real-time collaboration (multiple users in same unit turn) | Not a use case |
| AppFolio replacement | This augments AppFolio — all records still live in AppFolio |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| PORTAL-01 | Phase 1 | Pending |
| PORTAL-04 | Phase 1 | Pending |
| ENGINE-01 | Phase 1 | Pending |
| ENGINE-02 | Phase 1 | Pending |
| ENGINE-03 | Phase 1 | Pending |
| ENGINE-04 | Phase 1 | Pending |
| LOG-01 | Phase 1 | Pending |
| MATRIX-01 | Phase 2 | Pending |
| MATRIX-02 | Phase 2 | Pending |
| MATRIX-03 | Phase 2 | Pending |
| MATRIX-04 | Phase 2 | Pending |
| QUEST-01 | Phase 3 | Pending |
| QUEST-02 | Phase 3 | Pending |
| QUEST-03 | Phase 3 | Pending |
| QUEST-04 | Phase 3 | Pending |
| PORTAL-02 | Phase 3 | Pending |
| PORTAL-03 | Phase 3 | Pending |
| LOG-02 | Phase 3 | Pending |
| LOG-03 | Phase 3 | Pending |
| UNIT-01 | Phase 4 | Pending |
| UNIT-02 | Phase 4 | Pending |
| UNIT-03 | Phase 4 | Pending |
| UNIT-04 | Phase 4 | Pending |
| UNIT-05 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 27 total
- Mapped to phases: 27
- Unmapped: 0

---
*Requirements defined: 2026-04-01*
*Last updated: 2026-04-01 after roadmap creation — traceability populated*
