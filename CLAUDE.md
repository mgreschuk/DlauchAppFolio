<!-- GSD:project-start source:PROJECT.md -->
## Project

**AppFolio Automation Platform — DLauch Client Portal**

A client portal and automation engine built for a New York real estate investor, enabling him and his team to execute AppFolio administrative tasks through a clean, professional interface rather than manual clicks. Behind the interface, a set of automations handles the AppFolio API calls, record creation, and data management. The system is designed to scale from human-supervised to near-fully autonomous over time.

**Core Value:** A user selects what they want done, clicks Go, and it happens — with full transparency into what the automation did and why.

### Constraints

- **API:** AppFolio API coverage is incomplete — PO creation path unknown; design automations to be swappable between API and browser automation without rebuilding the business logic layer
- **Data integrity:** Client's #1 concern is not corrupting AppFolio data — all automations must be testable in sandbox before production
- **Agility:** AppFolio UI and API may change (especially since sandbox/production already diverge) — avoid tight coupling to UI structure
- **Scale:** Portal is for ~10 users max; no need for enterprise multi-tenancy architecture
- **Timeline:** Flexible — quality over speed; no hard deadline for Phase 1
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommended Stack
### Frontend
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js | 15.5 (App Router) | Full-stack React framework | Server Components cut API round-trips for dashboards; App Router supports layouts needed for portal nav; largest ecosystem for solo devs means answers are everywhere. Not switching to SvelteKit despite its DX edge — the React ecosystem is more relevant for this project's longevity and hiring if it ever grows. |
| React | 19 | UI layer | Ships with Next.js 15. Concurrent features reduce perceived latency in approval queues. |
| Tailwind CSS | v4.x (stable since Jan 2025) | Utility-first styling | v4 is a full rewrite — 5x faster builds, Rust-based Oxide engine, no config file required, CSS-first theming. Use it from day one rather than migrating later. |
| shadcn/ui | latest (Tailwind v4 + React 19 compatible) | Component library | Not a dependency — components are copied into the project, giving full control. Already updated for Tailwind v4 and React 19 as of early 2025. Perfect for a polished SaaS UI without fighting a design system you don't own. Use: `npx shadcn@latest init`. |
| TanStack Query | v5 | Client-side server state | Handles polling for job status, approval queue updates, and activity log refreshes without boilerplate. Pairs cleanly with Next.js Server Actions for mutations. |
### Backend / API Layer
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js Route Handlers | (built-in, 15.5) | REST API endpoints | Keeps the stack unified — no separate Express/Fastify server to deploy and maintain. Route Handlers in App Router support streaming, which is useful for live job progress. |
| Zod | v4 | Input validation and schema definition | v4 released August 2025 — 14x faster parsing, 57% smaller bundle, first-party JSON Schema generation. Use for all AppFolio API request/response shapes and internal API validation. Single source of truth for TypeScript types via `z.infer`. |
| node-fetch / native fetch | Node 20+ built-in | AppFolio REST API calls | Node 20 ships stable native `fetch`. No library needed for basic REST calls. Add `undici` only if you need connection pooling under high load (unlikely at ~10 users). |
### Automation Engine
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| pg-boss | v10.x | Background job queue | Uses the same PostgreSQL database already in the stack — no Redis to provision, operate, or pay for. Exactly-once delivery via `SKIP LOCKED`. Version 10 introduced proper dead-letter queues and stately queues (1 queued + 1 active), which maps directly to the "Quest" approval flow — queue a job, hold it pending approval, release or discard it. Node 20 minimum (matches our stack). |
| Playwright | 1.59.x | Browser automation fallback | Microsoft-maintained, actively developed (1.59.0 released April 2026). Only used if AppFolio's Purchase Order API gap cannot be resolved. Isolate all Playwright code behind the same service interface as API calls (`src/lib/appfolio/purchase-orders.ts`) — callers never know which path ran. Run headless in a long-running Node process, NOT in a serverless function (browser binaries are too large for serverless cold starts). |
### Database
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| PostgreSQL | 16 (via Neon) | Primary data store | Holds users, automation configs (scope matrix), job queue (pg-boss), execution logs, and Quest approval records. |
| Neon | latest | Serverless Postgres host | Scale-to-zero eliminates idle costs for a low-traffic internal tool. Instant database branching enables safe development against a production-like copy. Acquired by Databricks in 2025 — financially stable. Native Next.js/Vercel integration via `@neondatabase/serverless`. Free tier covers development and early production. |
| Drizzle ORM | 0.45.x | Database access layer | No code generation step — schema changes reflect immediately in TypeScript types, which is critical for a solo developer who needs a tight feedback loop. Tiny bundle (~57KB vs Prisma's 2MB+). SQL-like query API that's readable without an abstraction layer. Use `drizzle-kit` for migrations. |
### Authentication
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Auth.js (NextAuth.js) | v5 | Session management + login | Purpose-built for Next.js App Router. Credentials provider supports username/password without an OAuth dependency. ~10 users means simple credential management is sufficient — no need for enterprise SSO. v5 uses `AUTH_` env prefix, integrates with App Router middleware for protected routes. |
### Deployment
| Technology | Purpose | Why |
|------------|---------|-----|
| Railway | Application + worker host | Supports multiple services in one project: (1) Next.js web app, (2) pg-boss worker process. Persistent compute (no cold starts) is required for the worker — serverless platforms cannot run the job processor. $8–15/month for a solo project. Better DX than Fly.io for a solo dev who doesn't want to manage infrastructure. Vercel is ruled out because it cannot run a persistent background worker alongside the web app. |
| Neon | Database host | (see Database section) |
| GitHub Actions | CI/CD | Free for private repos at this scale. Run type-check, lint, and migration dry-runs on PR. Deploy to Railway on merge to main. |
### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@neondatabase/serverless` | latest | Neon Postgres driver | Always — required for Next.js serverless functions to connect to Neon |
| `drizzle-orm` | ~0.45 | ORM | Always |
| `drizzle-kit` | ~0.30 | Migrations CLI | Dev dependency |
| `bcryptjs` | ^3 | Password hashing | Auth user table |
| `date-fns` | v4 | Date formatting in logs/UI | Whenever displaying timestamps in activity logs |
| `zod` | v4 | Validation | Always — all API inputs, all AppFolio response shapes |
| `@tanstack/react-query` | v5 | Client data fetching | For polling job status and approval queue in the UI |
| `lucide-react` | latest | Icons | Ships with shadcn/ui, use consistently |
| `clsx` + `tailwind-merge` | latest | Conditional classnames | Ships with shadcn/ui setup |
## Alternatives Considered
| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Frontend framework | Next.js 15 | SvelteKit | SvelteKit has better DX scores but smaller ecosystem. React + Next.js gives more answered questions on Stack Overflow and Claude. Not worth the switch for internal tooling. |
| Frontend framework | Next.js 15 | Remix | Remix's loader/action pattern is excellent but it's directionally merging into React Router. Next.js has stronger momentum and broader shadcn/ui compatibility. |
| ORM | Drizzle | Prisma | Prisma's code-gen step slows iteration. Drizzle's instant type reflection is a better fit for a solo dev feedback loop. |
| Job queue | pg-boss | BullMQ | BullMQ requires Redis — adds infrastructure cost and complexity with no benefit at this scale. |
| Job queue | pg-boss | Hand-rolled polling | Will eventually fail on edge cases (worker crash recovery, duplicate job prevention). pg-boss handles these correctly. |
| Auth | Auth.js v5 | Clerk | Clerk is excellent but costs money per MAU and adds external dependency. For ~10 fixed users, a credentials table in your own DB is simpler and free. |
| Auth | Auth.js v5 | Lucia | Lucia is now documentation-only (archived in 2025). Do not use. |
| Database host | Neon | Supabase | Supabase bundles auth/storage/realtime this project doesn't need. Neon is pure Postgres with better Next.js integration. |
| Deployment | Railway | Vercel | Cannot run a persistent background worker. Disqualified by architecture requirements. |
| Deployment | Railway | Fly.io | Fly.io is cheaper per compute unit but requires more DevOps knowledge. Not worth the ops overhead for a solo dev at this traffic level. |
| Browser automation | Playwright | Puppeteer | Playwright is actively maintained by Microsoft and has a better API. Puppeteer is Chrome-only. Playwright is the clear choice if the fallback is ever needed. |
| Validation | Zod v4 | Yup | Zod's TypeScript-first design generates types automatically. Yup requires parallel type definitions. |
| Component library | shadcn/ui | Chakra UI / MUI | shadcn/ui components live in your codebase — no version conflicts, full customization. MUI and Chakra impose design opinions that are harder to override for a branded SaaS feel. |
## Installation
# Scaffold Next.js 15 with App Router, Tailwind v4, TypeScript
# Database
# Auth
# Job queue
# Validation
# Client state
# UI
# Browser automation fallback (install separately, only when needed)
## Architecture Fit Notes
## Sources
- Next.js 15.5 release: https://nextjs.org/blog/next-15-5
- Tailwind CSS v4.0 stable: https://tailwindcss.com/blog/tailwindcss-v4
- shadcn/ui Tailwind v4 docs: https://ui.shadcn.com/docs/tailwind-v4
- Auth.js v5 migration guide: https://authjs.dev/getting-started/migrating-to-v5
- Drizzle ORM npm (v0.45.2): https://www.npmjs.com/package/drizzle-orm
- Drizzle v1.0 beta release notes: https://orm.drizzle.team/docs/latest-releases/drizzle-orm-v1beta2
- Neon vs Supabase comparison: https://www.devtoolsacademy.com/blog/neon-vs-supabase/
- pg-boss v10 release notes: https://github.com/timgit/pg-boss/releases/tag/10.0.0
- pg-boss npm: https://www.npmjs.com/package/pg-boss
- BullMQ vs pg-boss tradeoffs: https://judoscale.com/blog/node-task-queues
- Playwright npm (1.59.x): https://www.npmjs.com/package/playwright
- Zod v4 release: https://www.infoq.com/news/2025/08/zod-v4-available/
- Railway vs Fly.io vs Vercel 2025: https://www.jasonsy.dev/blog/comparing-deployment-platforms-2025
- Drizzle vs Prisma 2025: https://makerkit.dev/blog/tutorials/drizzle-vs-prisma
- TanStack Query v5 docs: https://tanstack.com/query/v5/docs/framework/react/overview
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
