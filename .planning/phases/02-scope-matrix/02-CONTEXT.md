# Phase 2: Scope Matrix - Context

**Gathered:** 2026-04-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver an admin-facing CRUD interface for the scope-to-category-to-vendor mapping that drives all unit turn automations. Admin can view all entries in a data table, add new entries via a modal form, edit existing entries, and deactivate entries (soft-delete with toggle). The scope matrix table in the database becomes the single source of truth for automation inputs in Phases 3-5.

No automation execution in Phase 2. No Quest flow. No unit turn workflow. No CSV import. No PO/WO creation. This phase is purely admin configuration.

</domain>

<decisions>
## Implementation Decisions

### Matrix Display & Layout
- **D-01:** Full-width data table layout with sortable columns. Compact row density (~20+ rows visible) to accommodate potentially large scope lists.
- **D-02:** Search bar plus dropdown column filters on category and vendor columns. Text search filters across all columns.
- **D-03:** Scope Matrix gets its own top-level sidebar nav entry alongside Dashboard — it's admin config, not a sub-page of Unit Turn.

### Edit Experience
- **D-04:** Modal dialog (shadcn/ui Dialog) for both adding and editing scope entries. "Add Scope" button above the table opens the modal; edit icon on each row opens the same modal pre-filled.
- **D-05:** Vendor and category fields use combobox inputs — suggest existing values as the admin types, but allow entering new values. Prevents typos while maintaining flexibility.
- **D-06:** Toast notification on successful add/edit/deactivation. Modal closes, table updates immediately, brief success toast appears.

### Deactivation UX
- **D-07:** Toggle switch per row for active/inactive status. Instant flip, no confirmation dialog — low-risk and reversible.
- **D-08:** Default table view shows active entries only. A "Show inactive" filter toggle reveals deactivated entries inline, visually dimmed. Inactive entries can be reactivated via the same toggle switch.

### Scope Data Fields
- **D-09:** Baseline fields only: scope name, unit turn category, preferred vendor, work description, active/inactive status. Additional automation input columns deferred until Phases 3-5 reveal what's needed.
- **D-10:** Manual entry only through the modal form. No CSV/spreadsheet import in Phase 2.
- **D-11:** Scope name must be unique (enforced at database level). Same vendor or category can appear across multiple scope entries — this is expected.

### Claude's Discretion
- Database schema design (table name, column types, indexes)
- API route structure for CRUD operations
- Table component implementation (TanStack Table or simpler approach)
- Combobox implementation details
- Toast component selection and positioning
- Form validation details beyond uniqueness constraint

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project & Stack
- `CLAUDE.md` — Full technology stack decisions, library versions, and project constraints. Source of truth for all technology choices.
- `.planning/REQUIREMENTS.md` — Phase 2 requirement definitions: MATRIX-01, MATRIX-02, MATRIX-03, MATRIX-04.
- `.planning/ROADMAP.md` — Phase 2 goal, success criteria, and dependency map.

### Prior Phase Context
- `.planning/phases/01-foundation-appfolio-connectivity/01-CONTEXT.md` — Phase 1 decisions establishing UI patterns, dark theme, shadcn/ui components, and product name "Turnkey".

### Existing Code
- `src/db/schema.ts` — Current DB schema with users and activityLog tables. activityLog already has `scopeId` column expecting a scopes table.
- `src/components/sidebar-nav.tsx` — Sidebar navigation structure. Phase 2 adds a "Scope Matrix" entry here.
- `src/components/ui/` — Existing shadcn/ui components: badge, button, card, input, label, separator. Phase 2 will need additional components (dialog, table, switch, toast, combobox).
- `src/app/(authenticated)/dashboard/page.tsx` — Dashboard layout pattern (dark theme, Card usage, grid layout).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **shadcn/ui component library**: badge, button, card, input, label, separator already installed. Phase 2 needs: dialog, table, switch, toast/sonner, combobox/command.
- **Drizzle ORM + Neon DB**: Schema in `src/db/schema.ts`, connection in `src/db/index.ts`. Scope matrix table follows the same pattern.
- **SidebarNav component**: `src/components/sidebar-nav.tsx` uses a `navItems` array — adding "Scope Matrix" is a one-line addition.

### Established Patterns
- **Dark theme**: `#0f172a` page bg, `#1e293b` card/surface bg, `#f8fafc` primary text, `#94a3b8` muted text, `#3b82f6` accent blue.
- **Page layout**: `h1` at 20px semibold, content below with mt-6 spacing. See dashboard page.
- **Component styling**: Tailwind utility classes with explicit hex colors (not theme tokens). Border color `#334155`.
- **Auth middleware**: `src/app/(authenticated)/layout.tsx` wraps all protected pages — scope matrix page goes inside this route group.

### Integration Points
- **Database**: New `scopes` table in `src/db/schema.ts` alongside existing tables.
- **Sidebar nav**: New entry in `navItems` array in `src/components/sidebar-nav.tsx`.
- **Route**: New page at `src/app/(authenticated)/scope-matrix/page.tsx`.
- **API routes**: New routes at `src/app/api/scopes/` for CRUD operations.
- **Activity log**: `activityLog.scopeId` already references future scope entries — foreign key relationship.

</code_context>

<specifics>
## Specific Ideas

- The scope matrix is the "configuration layer driving all unit turn automations" (PROJECT.md). It must be solid and validated before Phases 3-5 build automation on top of it.
- Combobox for vendor/category fields is key — the client's team isn't technical, so preventing typos while allowing new values strikes the right balance.
- Compact table density chosen because the scope list may grow. The existing dashboard is spacious, but admin config tables benefit from density.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-scope-matrix*
*Context gathered: 2026-04-17*
