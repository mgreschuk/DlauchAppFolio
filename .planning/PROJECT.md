# AppFolio Automation Platform — DLauch Client Portal

## What This Is

A client portal and automation engine built for a New York real estate investor, enabling him and his team to execute AppFolio administrative tasks through a clean, professional interface rather than manual clicks. Behind the interface, a set of automations handles the AppFolio API calls, record creation, and data management. The system is designed to scale from human-supervised to near-fully autonomous over time.

## Core Value

A user selects what they want done, clicks Go, and it happens — with full transparency into what the automation did and why.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Milestone 1 — Unit Turn Automation**

- [ ] Scope selection UI: user picks applicable scopes for a unit turn from a predefined list
- [ ] Unit selector: user picks the target unit from AppFolio's unit list
- [ ] One-click Go: triggers the full automation sequence
- [ ] Work order creation: one work order per unit turn category via AppFolio API (or fallback)
- [ ] Purchase order creation: one PO per vendor, grouped across all work orders for that vendor
- [ ] Scope-to-category-to-vendor matrix: configurable mapping that drives automation inputs
- [ ] Action preview / approval flow ("Quest"): before executing, show the user what was heard, how it was interpreted, what will happen, what inputs will be used, and request approval
- [ ] Execution log: persistent, human-readable record of all automation activity
- [ ] Sandbox-first testing: all automation development tested against AppFolio sandbox before production

**Client Portal Foundation**

- [ ] Clean, modern SaaS UI (neutral palette, professional feel)
- [ ] Portal home: entry point for all automation tools, not just unit turns
- [ ] Activity log: visible, layman-readable history of what automations have done
- [ ] Quest inbox: pending human approvals and decision requests from automations
- [ ] Multi-user support: owner + small team (~10 users max)

**Future Milestones (scoped, not planned)**

- [ ] Payables automation: bill creation from invoices, reconciliation of expense transactions
- [ ] Utility expense tracking: scrape utility billing sites, trend analysis vs. past bills and other units
- [ ] QBO bridge: allocate Parent Co expenses to property entities with rule-based logic

### Out of Scope

- Browser/UI automation for AppFolio — avoid unless API gaps make it unavoidable; brittle and breaks on UI changes
- Full accounting system replacement — this augments AppFolio, not replaces it
- Mobile app — web portal only for now
- More than ~10 concurrent users — not a multi-tenant SaaS product

## Context

**Client:** New York real estate investor, multiple large properties. Revel 1 Solutions (Matt Greschuk) contracted to build.

**AppFolio Record Hierarchy for Unit Turns:**
```
Maintenance → Unit Turns → [Unit Record]
  └── Unit Turn Categories (e.g., Paint, Maintenance, Cabinetry)
        └── Work Orders (one per category, tied to vendor)
              └── Purchase Orders (one per vendor, can reference multiple WOs)
```
Work orders = internal planning documents. Purchase orders = external vendor-facing documents. Vendors receive POs, complete work, submit invoices referencing the PO.

**Scope Matrix:** Client provided a spreadsheet mapping scopes → unit turn categories → preferred vendors. Needs expansion (additional columns for automation inputs). This matrix is the configuration layer driving all unit turn automations.

**AppFolio API:**
- Production and sandbox environments, both with API keys
- Sandbox UI and API docs appear to be on an older version than production — known discrepancies exist
- **Known gap:** Purchase orders are not documented in the API. May be representable as a different record type with appropriate fields — AppFolio support contacted for clarification
- Fallback option: browser automation (Playwright/Puppeteer) for PO creation only if API gap cannot be resolved — last resort due to fragility

**The Autonomy Roadmap (guiding principle):**
The portal should support a phased autonomy model:
1. **Stage 1 (now):** Automation logs proposed actions, requests approval before executing
2. **Stage 2:** Automation executes simple tasks, logs everything, requests approval on complex ones
3. **Stage 3:** Near-full autonomy, logging everything, stops only when told to

Every design decision should make it easier to dial autonomy up or down per task type without rebuilding the system.

**"Quests" concept:** Human control points where an automation presents:
- What it heard
- How it interpreted the request
- What it plans to do
- What inputs it will use
- Expected output
- Request for approval

This is the early-stage safety layer and the UX differentiator of the portal.

## Constraints

- **API:** AppFolio API coverage is incomplete — PO creation path unknown; design automations to be swappable between API and browser automation without rebuilding the business logic layer
- **Data integrity:** Client's #1 concern is not corrupting AppFolio data — all automations must be testable in sandbox before production
- **Agility:** AppFolio UI and API may change (especially since sandbox/production already diverge) — avoid tight coupling to UI structure
- **Scale:** Portal is for ~10 users max; no need for enterprise multi-tenancy architecture
- **Timeline:** Flexible — quality over speed; no hard deadline for Phase 1

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Scope matrix as external config (not hardcoded) | Client needs to add/edit scopes without a developer | — Pending |
| Quest approval flow in Phase 1 | Builds trust in automation before increasing autonomy; also a debugging tool | — Pending |
| Sandbox-first development | Production and sandbox diverge — need to understand gaps before going live | — Pending |
| API-first for AppFolio, browser automation as fallback only | UI changes break browser automation; API is more stable and maintainable | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-01 after initialization*
