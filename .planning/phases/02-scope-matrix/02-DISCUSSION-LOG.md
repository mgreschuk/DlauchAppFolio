# Phase 2: Scope Matrix - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-17
**Phase:** 02-scope-matrix
**Areas discussed:** Matrix display & layout, Edit experience, Deactivation UX, Scope data fields

---

## Matrix Display & Layout

### Q1: How should the scope matrix be displayed?

| Option | Description | Selected |
|--------|-------------|----------|
| Data table (Recommended) | Full-width table with sortable columns, search/filter bar. Natural fit for tabular data. | :heavy_check_mark: |
| Card grid | One card per scope entry. Matches dashboard pattern but harder to scan. | |
| Spreadsheet-like | Editable grid similar to Google Sheets. Power-user friendly but heaviest to build. | |

**User's choice:** Data table
**Notes:** None

### Q2: How dense should the table be?

| Option | Description | Selected |
|--------|-------------|----------|
| Comfortable (Recommended) | More padding, larger text. ~10-12 rows on screen. | |
| Compact | Tight padding, smaller text. ~20+ rows on screen. | :heavy_check_mark: |

**User's choice:** Compact
**Notes:** None

### Q3: Should the table include search/filter capabilities?

| Option | Description | Selected |
|--------|-------------|----------|
| Search + column filters (Recommended) | Text search bar plus dropdown filters on category and vendor columns. | :heavy_check_mark: |
| Search only | Single text search bar across all columns. | |
| No filtering | Raw table, add filtering later. | |

**User's choice:** Search + column filters
**Notes:** None

### Q4: Should the scope matrix get its own sidebar nav entry?

| Option | Description | Selected |
|--------|-------------|----------|
| Own sidebar entry (Recommended) | Top-level nav item alongside Dashboard. | :heavy_check_mark: |
| Under Unit Turn | Tab or sub-page within Unit Turn section. | |

**User's choice:** Own sidebar entry
**Notes:** None

---

## Edit Experience

### Q1: How should adding and editing scope entries work?

| Option | Description | Selected |
|--------|-------------|----------|
| Modal dialog (Recommended) | Click "Add Scope" or row edit icon opens modal form over table. | :heavy_check_mark: |
| Slide-out drawer | Form slides in from right. Table stays visible. | |
| Inline row editing | Cells become editable inputs directly in table. | |

**User's choice:** Modal dialog
**Notes:** None

### Q2: Should vendors and categories be free-text or selectable?

| Option | Description | Selected |
|--------|-------------|----------|
| Free-text for both | Admin types anything. Risk of typos. | |
| Dropdowns from existing entries (Recommended) | Combobox suggests existing values, allows new. | :heavy_check_mark: |
| Strict dropdown lists | Must choose from managed list. Requires separate admin flow. | |

**User's choice:** Dropdowns from existing entries
**Notes:** None

### Q3: How should the user know an add/edit worked?

| Option | Description | Selected |
|--------|-------------|----------|
| Toast notification (Recommended) | Brief success message in corner. Non-blocking. | :heavy_check_mark: |
| Inline success state | Row briefly highlights green. | |
| You decide | Claude picks best pattern. | |

**User's choice:** Toast notification
**Notes:** None

---

## Deactivation UX

### Q1: How should deactivating a scope entry work?

| Option | Description | Selected |
|--------|-------------|----------|
| Toggle switch per row (Recommended) | Active/inactive toggle. Instant, reversible, no confirmation. | :heavy_check_mark: |
| Action menu with "Deactivate" | Three-dot menu with confirmation dialog. | |
| Bulk select + deactivate | Checkboxes + toolbar button. | |

**User's choice:** Toggle switch per row
**Notes:** None

### Q2: Where should deactivated entries appear?

| Option | Description | Selected |
|--------|-------------|----------|
| Same table, filtered (Recommended) | Default shows active. "Show inactive" toggle reveals dimmed rows. | :heavy_check_mark: |
| Separate tab | "Active" and "Inactive" tabs above table. | |
| Hidden entirely | Disappear from UI. Only visible in database. | |

**User's choice:** Same table, filtered
**Notes:** None

---

## Scope Data Fields

### Q1: What fields should each scope entry have?

| Option | Description | Selected |
|--------|-------------|----------|
| Baseline only (Recommended) | Name, category, vendor, description, active status. Add columns later. | :heavy_check_mark: |
| Baseline + cost estimate | Add cost/budget field per entry. | |
| Baseline + priority/order | Add sort order or priority field. | |
| I know the full list | User describes additional columns. | |

**User's choice:** Baseline only
**Notes:** None

### Q2: Should the matrix support spreadsheet import?

| Option | Description | Selected |
|--------|-------------|----------|
| Manual entry only (Recommended) | Add entries one at a time through modal form. | :heavy_check_mark: |
| CSV import + manual | Upload CSV to bulk-populate, then use form for ongoing edits. | |
| You decide | Claude picks. | |

**User's choice:** Manual entry only
**Notes:** None

### Q3: Should duplicate detection be enforced?

| Option | Description | Selected |
|--------|-------------|----------|
| Unique scope name (Recommended) | Scope name must be unique. Same vendor/category across entries OK. | :heavy_check_mark: |
| Unique name + category combo | Both name and scope+category combination must be unique. | |
| No enforcement | Allow anything. Admin responsible. | |

**User's choice:** Unique scope name
**Notes:** None

---

## Claude's Discretion

- Database schema design (table name, column types, indexes)
- API route structure for CRUD operations
- Table component implementation approach
- Combobox implementation details
- Toast component selection and positioning
- Form validation details beyond uniqueness

## Deferred Ideas

None — discussion stayed within phase scope.
