---
phase: 01-foundation-appfolio-connectivity
plan: "02"
subsystem: ui
tags: [next.js, react, tailwind, shadcn, auth.js, sidebar, dashboard, portal-shell]

# Dependency graph
requires:
  - phase: 01-foundation-appfolio-connectivity
    plan: "01"
    provides: Auth.js v5 session, shadcn components installed, Next.js 16 scaffold
provides:
  - Authenticated portal shell with 240px sidebar (secondary bg #1e293b)
  - Sidebar with Turnkey branding, Dashboard nav item, user email + logout
  - Dashboard page with AppFolio Connection card and Unit Turn nav card
  - Unit Turn placeholder page at /unit-turn
  - requireAuth() server helper for protected route groups
  - (authenticated) route group layout
affects: [03-engine-primitives, 04-connectivity-deploy]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Route group layout: (authenticated)/layout.tsx wraps pages with requireAuth + Sidebar
    - Auth-protected pages via requireAuth() server helper using auth() from Auth.js
    - Client component isolation: SidebarNav and LogoutButton are "use client", Sidebar is server
    - usePathname-based active nav state in client component

key-files:
  created:
    - src/lib/auth-helpers.ts (requireAuth server helper)
    - src/components/sidebar.tsx (240px sidebar, Turnkey branding, server component)
    - src/components/sidebar-nav.tsx (client, usePathname active state, Dashboard nav item)
    - src/components/logout-button.tsx (client, signOut from next-auth/react)
    - src/app/(authenticated)/layout.tsx (route group layout with requireAuth + Sidebar)
    - src/app/(authenticated)/dashboard/page.tsx (dashboard with status + Unit Turn cards)
    - src/app/(authenticated)/unit-turn/page.tsx (Unit Turn placeholder page)
  modified:
    - src/app/dashboard/page.tsx (deleted — replaced by authenticated group page)

key-decisions:
  - "(authenticated) route group layout handles session + sidebar for all authenticated pages"
  - "LogoutButton is client component using next-auth/react signOut (not server action) — simpler pattern for single-click logout"
  - "SidebarNav is client component isolated from server Sidebar — usePathname requires client context"

patterns-established:
  - "Auth gate pattern: requireAuth() in (authenticated)/layout.tsx protects all nested pages"
  - "Sidebar client/server split: Sidebar (server) wraps SidebarNav + LogoutButton (client)"
  - "Card pattern: bg-[#1e293b] border border-[#334155] rounded-lg for all dashboard cards"

requirements-completed: [PORTAL-01, PORTAL-04]

# Metrics
duration: 4min
completed: 2026-04-02
---

# Phase 1 Plan 02: Portal Shell Summary

**Dark-theme authenticated portal shell with 240px sidebar (Turnkey branding, usePathname nav, signOut), dashboard with AppFolio Connection card and clickable Unit Turn nav card, and /unit-turn placeholder — all behind requireAuth route group guard**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-04-02T00:49:10Z
- **Completed:** 2026-04-02T00:53:00Z
- **Tasks:** 2 of 2
- **Files modified:** 8

## Accomplishments
- Built full authenticated portal shell: (authenticated) route group layout with requireAuth guard and 240px sidebar
- Sidebar implements all UI-SPEC requirements: Turnkey product name, Dashboard nav with active accent border, user email footer, destructive-color Log Out button
- Dashboard page has AppFolio Connection placeholder card and clickable Unit Turn nav card linking to /unit-turn
- Unit Turn placeholder page created, satisfying PORTAL-04 navigation requirement

## Task Commits

Each task was committed atomically:

1. **Task 1: Build sidebar component and authenticated layout** - `3626a60` (feat)
2. **Task 2: Build dashboard page and Unit Turn placeholder** - `191a979` (feat)

**Plan metadata:** (created below in final commit)

## Files Created/Modified

- `src/lib/auth-helpers.ts` - requireAuth() server helper — calls auth(), redirects to /login if no session
- `src/components/sidebar.tsx` - Sidebar server component: 240px, bg-[#1e293b], Turnkey title, SidebarNav, user email + LogoutButton footer
- `src/components/sidebar-nav.tsx` - Client component: usePathname active state, 4px accent left border when active, Dashboard nav item with LayoutDashboard icon
- `src/components/logout-button.tsx` - Client component: signOut({ callbackUrl: "/login" }), ghost variant, #ef4444 destructive text
- `src/app/(authenticated)/layout.tsx` - Route group layout: requireAuth() + Sidebar + main content area (flex h-screen)
- `src/app/(authenticated)/dashboard/page.tsx` - Dashboard: "Dashboard" heading, AppFolio Connection card, Unit Turn nav card (Link to /unit-turn)
- `src/app/(authenticated)/unit-turn/page.tsx` - Placeholder page with "Unit Turn" heading and future-update body text
- `src/app/dashboard/page.tsx` - Deleted stub from Plan 01 (replaced by authenticated group page)

## Decisions Made

- **LogoutButton uses next-auth/react signOut (client):** The plan mentioned both "signOut server action" and "next-auth/react" options. Chose client-side next-auth/react signOut since LogoutButton is already a client component — keeps the logout pattern simple and aligned with Auth.js v5 client usage.
- **SidebarNav extracted as client component:** usePathname() requires React client context, but Sidebar itself can remain a server component. Client/server split keeps the server component tree clean.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed missing node_modules**
- **Found during:** Task 1 verification (npm run build)
- **Issue:** Worktree had no node_modules — git worktrees don't inherit node_modules from the main branch
- **Fix:** Ran npm install in the worktree directory
- **Files modified:** package-lock.json (lock file re-resolved)
- **Verification:** npm run build passes after install
- **Committed in:** 3626a60 (Task 1 commit, package-lock.json included)

---

**Total deviations:** 1 auto-fixed (Rule 3 - blocking)
**Impact on plan:** Required fix to enable any build verification. No scope creep. package-lock.json update is expected for a fresh worktree.

## Issues Encountered

- Old `src/app/dashboard/page.tsx` stub from Plan 01 conflicts with new `src/app/(authenticated)/dashboard/page.tsx` since both resolve to the /dashboard route. Removed the old stub via `git rm` as part of Task 2 commit.

## User Setup Required

None - no external service configuration required. All components are pure UI built on the Auth.js session established in Plan 01.

## Next Phase Readiness

- All authenticated pages can use requireAuth() from @/lib/auth-helpers for session access
- Dashboard AppFolio Connection card is a placeholder — Plan 04 (connectivity + deploy) will wire the actual API status
- Sidebar nav array in sidebar-nav.tsx is ready for expansion in future phases (add nav items as new tools are built)
- `npm run build` exits 0, all routes verified: /, /login, /dashboard, /unit-turn, /api/auth/[...nextauth]

## Known Stubs

- `src/app/(authenticated)/dashboard/page.tsx` — AppFolio Connection card shows "Checking AppFolio connection..." permanently. This is an intentional placeholder per UI-SPEC empty state spec. Plan 04 (connectivity + deploy) will wire real API health check status.

## Self-Check: PASSED

- All 7 created/deleted files verified via build output and git log
- Commits 3626a60 and 191a979 confirmed in git history
- `npm run build` exits 0, routes /dashboard and /unit-turn appear in route table

---
*Phase: 01-foundation-appfolio-connectivity*
*Completed: 2026-04-02*
