# Roadmap: AppFolio Automation Platform — DLauch Client Portal

## Overview

Five phases deliver a complete unit turn automation portal. The foundation establishes secure access, the AppFolio adapter, and the automation engine primitives that every later phase depends on. The scope matrix gives the client admin control before any automation runs. The Quest engine provides the human approval checkpoint and activity log before a single write touches AppFolio. Work order creation follows as the first production write operation, fully gated behind Quest approval. Purchase order creation closes out the unit turn automation with a deferred phase that can absorb the unresolved PO API gap without blocking earlier work.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation + AppFolio Connectivity** - Auth, portal shell, AppFolio adapter, engine primitives, activity log persistence
- [ ] **Phase 2: Scope Matrix** - Admin UI to view and manage the scope-to-category-to-vendor mapping
- [ ] **Phase 3: Quest Engine + Approval Flow** - Quest builder, approval inbox, execution log display, and portal navigation
- [ ] **Phase 4: Work Order Automation** - Unit selector, scope picker, Go trigger, and work order creation via AppFolio API
- [ ] **Phase 5: Purchase Order Automation + Hardening** - PO creation (API or Playwright fallback), sandbox-to-production promotion, production readiness

## Phase Details

### Phase 1: Foundation + AppFolio Connectivity
**Goal**: Users can securely access the portal and the system can read live data from AppFolio through a stable adapter that isolates all business logic from the API implementation.
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, PORTAL-01, PORTAL-04, ENGINE-01, ENGINE-02, ENGINE-03, ENGINE-04, LOG-01
**Success Criteria** (what must be TRUE):
  1. User can log in with email and password and stay logged in across browser refreshes
  2. User can log out from any page and their session is immediately invalidated
  3. Portal home loads and shows a navigation entry point for the Unit Turn tool
  4. AppFolio unit list is fetchable from sandbox environment without authentication errors, at or below the rate limit ceiling
  5. Every automation action (start, step, completion, failure) is written to the activity log in the database in plain language — verifiable by querying the log table directly
**Plans:** 1/4 plans executed

Plans:
- [x] 01-01-PLAN.md — Project scaffold, DB schema, Auth.js credentials provider
- [ ] 01-02-PLAN.md — Portal shell UI: sidebar, dashboard, Unit Turn placeholder
- [ ] 01-03-PLAN.md — AppFolio adapter, rate limiter, state machine, activity log writer
- [ ] 01-04-PLAN.md — AppFolio status wiring, deployment infra, Railway deploy

**UI hint**: yes

### Phase 2: Scope Matrix
**Goal**: An admin can view, add, edit, and deactivate scope entries in the portal, so the automation has a validated, database-backed mapping before any unit turn is attempted.
**Depends on**: Phase 1
**Requirements**: MATRIX-01, MATRIX-02, MATRIX-03, MATRIX-04
**Success Criteria** (what must be TRUE):
  1. Admin can open the scope matrix page and see all active scopes with their category, vendor, and work description
  2. Admin can add a new scope entry through a form and see it appear in the matrix immediately
  3. Admin can edit an existing scope's category, vendor, or description and see the change reflected
  4. Admin can deactivate a scope and confirm it no longer appears in the unit turn scope picker (but history is preserved)
**Plans**: TBD
**UI hint**: yes

### Phase 3: Quest Engine + Approval Flow
**Goal**: Before any AppFolio write ever executes, the system can generate a structured Quest showing exactly what it plans to do, persist it, accept or reject approval, update the outcome, and display the full activity history in the portal.
**Depends on**: Phase 2
**Requirements**: QUEST-01, QUEST-02, QUEST-03, QUEST-04, PORTAL-02, PORTAL-03, LOG-02, LOG-03
**Success Criteria** (what must be TRUE):
  1. A triggered automation generates a Quest showing: what was requested, how it was interpreted, what actions will be taken, what inputs will be used, and expected output — all in plain language
  2. User can approve a Quest from the Quest inbox and see its status change to Approved
  3. User can reject a Quest and confirm no AppFolio changes occurred
  4. After execution (using a stubbed write for this phase), the Quest updates with the actual outcome — success, failure, records created, or errors
  5. User can open the Activity Log and see all automation events listed in reverse-chronological order with action, unit/scope, timestamp, and status
**Plans**: TBD
**UI hint**: yes

### Phase 4: Work Order Automation
**Goal**: A user can select a unit and one or more scopes, trigger a Quest for approval, and upon approval the system creates the correct work orders in AppFolio — one per unit turn category — with no duplicates and no partial failures left uncorrected.
**Depends on**: Phase 3
**Requirements**: UNIT-01, UNIT-02, UNIT-03, UNIT-04
**Success Criteria** (what must be TRUE):
  1. User can select a target unit from the live AppFolio unit list in the portal
  2. User can select one or more scopes from the active scope matrix entries
  3. Clicking Go generates a Quest showing the exact work orders that will be created (category, vendor, description) before anything is written to AppFolio
  4. Upon Quest approval, AppFolio contains one work order per unit turn category with the correct vendor and description from the scope matrix — verified in sandbox
  5. If a work order for that category already exists, the system detects the duplicate and does not create a second one
**Plans**: TBD
**UI hint**: yes

### Phase 5: Purchase Order Automation + Hardening
**Goal**: The unit turn automation is complete end-to-end — POs are created in AppFolio grouping all work orders per vendor — and the system is hardened for production use with rate limiting, retry logic, and a sandbox-to-production promotion process.
**Depends on**: Phase 4
**Requirements**: UNIT-05
**Success Criteria** (what must be TRUE):
  1. Upon Quest approval, AppFolio contains one purchase order per vendor grouping all work orders for that vendor from the unit turn — verified in sandbox using either the API route or Playwright fallback
  2. The Quest preview shows POs alongside work orders so the user can confirm grouping before approving
  3. If the API route is used, requests stay within the rate limit ceiling with automatic throttling and exponential backoff on 429 responses
  4. A completed unit turn in sandbox can be reviewed and promoted to production following a documented promotion checklist — the first production run is always Quest-gated regardless of autonomy level
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation + AppFolio Connectivity | 1/4 | In Progress|  |
| 2. Scope Matrix | 0/TBD | Not started | - |
| 3. Quest Engine + Approval Flow | 0/TBD | Not started | - |
| 4. Work Order Automation | 0/TBD | Not started | - |
| 5. PO Automation + Hardening | 0/TBD | Not started | - |

---

## Coverage

| Requirement | Phase |
|-------------|-------|
| AUTH-01 | Phase 1 |
| AUTH-02 | Phase 1 |
| AUTH-03 | Phase 1 |
| PORTAL-01 | Phase 1 |
| PORTAL-04 | Phase 1 |
| ENGINE-01 | Phase 1 |
| ENGINE-02 | Phase 1 |
| ENGINE-03 | Phase 1 |
| ENGINE-04 | Phase 1 |
| LOG-01 | Phase 1 |
| MATRIX-01 | Phase 2 |
| MATRIX-02 | Phase 2 |
| MATRIX-03 | Phase 2 |
| MATRIX-04 | Phase 2 |
| QUEST-01 | Phase 3 |
| QUEST-02 | Phase 3 |
| QUEST-03 | Phase 3 |
| QUEST-04 | Phase 3 |
| PORTAL-02 | Phase 3 |
| PORTAL-03 | Phase 3 |
| LOG-02 | Phase 3 |
| LOG-03 | Phase 3 |
| UNIT-01 | Phase 4 |
| UNIT-02 | Phase 4 |
| UNIT-03 | Phase 4 |
| UNIT-04 | Phase 4 |
| UNIT-05 | Phase 5 |

**Total v1 requirements: 27 / 27 mapped. Coverage: 100%.**

---
*Roadmap created: 2026-04-01*
*Last updated: 2026-04-01 after Phase 1 planning complete*
