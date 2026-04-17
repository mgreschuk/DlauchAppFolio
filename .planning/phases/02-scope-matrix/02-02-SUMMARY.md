---
phase: 02-scope-matrix
plan: "02"
subsystem: scope-matrix-ui
tags: [shadcn-ui, react-query, data-table, modal, combobox, vendor-cache]
dependency_graph:
  requires: [scopes-table, scopes-api]
  provides: [scope-matrix-page, vendor-cache]
  affects: []
tech_stack:
  added: [sonner, "@tanstack/react-query"]
  patterns: [shadcn-dialog, shadcn-select, shadcn-switch, combobox-popover-command, react-query-mutations]
key_files:
  created:
    - src/app/(authenticated)/scope-matrix/page.tsx
    - src/components/scope-table.tsx
    - src/components/scope-form-modal.tsx
    - src/components/scope-filters.tsx
    - src/app/api/vendors/route.ts
    - src/app/api/vendors/sync/route.ts
    - src/app/api/appfolio/vendors/route.ts
  modified:
    - src/components/sidebar-nav.tsx
    - src/db/schema.ts
    - src/lib/appfolio/adapter.ts
    - src/lib/appfolio/api-client.ts
    - src/lib/appfolio/types.ts
    - src/app/api/scopes/route.ts
    - src/app/api/scopes/[id]/route.ts
decisions:
  - "Removed workDescription from scope matrix — work descriptions belong on unit turn creation, not static scope config"
  - "Vendors cached locally in vendors table, synced from AppFolio on demand via Sync Vendors button — eliminates live API dependency for dropdown"
  - "Vendor dropdown uses Select (not combobox) since vendors come from a fixed AppFolio list, not free-text entry"
  - "Category field keeps combobox pattern — suggests existing values but allows new entries"
  - "Uses @base-ui/react primitives via shadcn base-nova style — onOpenChange callbacks adapted for base-ui (open, eventDetails) signature"
  - "Switch uses onCheckedChange, Select uses onValueChange per base-ui API"
metrics:
  duration: ~20 min
  completed: "2026-04-17T17:30:00Z"
  tasks_completed: 3
  files_created: 7
  files_modified: 7
---

# Plan 02-02: Scope Matrix Admin UI

## What was built

Full scope matrix admin interface with data table, add/edit modal, vendor sync, and sidebar navigation.

### Scope Matrix Page
- New page at `/scope-matrix` inside authenticated route group
- "Scope Matrix" entry added to sidebar nav with Grid3X3 icon, below Dashboard
- Full-width data table with sortable columns: Scope Name, Category, Vendor, Status, Actions

### Data Table & Filters
- Search bar filtering across scope name, category, and vendor
- Category and Vendor dropdown filters (populated from existing scope entries)
- "Show inactive" toggle — inactive rows appear dimmed (opacity-50)
- Column sorting with visual sort indicators

### Add/Edit Modal
- Scope Name: text input
- Category: combobox (suggests existing categories, allows new)
- Vendor: Select dropdown populated from local vendors cache (synced from AppFolio)
- Toast notifications on success/error via sonner

### Active/Inactive Toggle
- Switch per row, instant flip, no confirmation dialog
- Toast notification on toggle

### Vendor Caching
- `vendors` table stores AppFolio vendor ID + name locally
- "Sync Vendors" button on scope matrix page pulls fresh list from AppFolio API
- Vendor dropdown reads from local DB — always fast, no live API dependency

## Post-checkpoint changes

User testing revealed two design issues, fixed before approval:

1. **Work description removed** — scope matrix is static config; work descriptions are per-unit-turn
2. **Vendor source changed** — dropdown now reads from local cache instead of live AppFolio API; "Sync Vendors" button for on-demand refresh

## Self-Check: PASSED

- [x] Sidebar nav shows "Scope Matrix" entry
- [x] Page loads at /scope-matrix
- [x] Data table displays with all columns
- [x] Add Scope modal opens and creates entries
- [x] Edit modal pre-fills existing values
- [x] Toggle switch activates/deactivates scopes
- [x] Show inactive filter works
- [x] Search and dropdown filters work
- [x] Duplicate scope name returns error toast
- [x] Build passes (npm run build exits 0)
