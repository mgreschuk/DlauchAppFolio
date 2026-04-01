# Domain Pitfalls: AppFolio Property Management Automation

**Domain:** Property management automation platform — AppFolio API integration, unit turn workflows, phased autonomy portal
**Researched:** 2026-04-01
**Confidence:** HIGH (API-specific) / MEDIUM (architecture/UX patterns) / HIGH (autonomy trust erosion, research-backed)

---

## Category 1: AppFolio API-Specific Pitfalls

---

### Pitfall 1.1: Undocumented Rate Limits Cause Silent Failures

**What goes wrong:** AppFolio's public API documentation does not publish explicit rate limits. The Reporting v2 API enforces 7 requests per 15 seconds on non-pagination endpoints. Developers who don't discover this empirically will build multi-step automation sequences (e.g., create 6+ work orders for a unit turn) that intermittently hit 429s without understanding why, then retry at the wrong cadence and cascade failures.

**Why it happens:** No published rate limit = developers assume no limit, or assume a much higher threshold.

**Consequences:** Intermittent automation failures on large unit turns, partial work order sets created, confusing error logs, user loses confidence in the system.

**Warning signs:**
- 429 HTTP responses in logs on multi-step sequences
- Failures only appear when processing units with many scopes (5+ categories = 5+ API calls in rapid succession)
- Works fine in testing (small cases) but fails in real usage

**Prevention strategy:**
- Build a request queue with a hard ceiling of 5 requests per 15 seconds (conservative of the known 7/15s limit)
- Implement exponential backoff on 429 responses (start at 2s, double on each retry, cap at 30s, max 3 retries)
- Log every API call with timestamp and response code from day one — rate limit violations become immediately visible

**Phase:** Address in Phase 1 (first AppFolio API call). Do not defer — the sequence involves multiple API calls per unit turn by design.

---

### Pitfall 1.2: Sandbox/Production Divergence Creates False Confidence

**What goes wrong:** The AppFolio sandbox UI and API are on an older version than production. Field names, required fields, default values, and available record types may differ. A workflow validated entirely in sandbox may fail in production on the first real run — potentially creating malformed records.

**Why it happens:** AppFolio presumably deploys sandbox and production on different release cycles. This is explicitly documented in the project context.

**Consequences:** Production creates records with wrong fields or missing fields, possibly corrupting accounting (e.g., a work order linked to the wrong unit, or a purchase order missing a required vendor reference). Client's #1 concern per project brief.

**Warning signs:**
- API responses differ in field count or structure between sandbox and production
- Fields present in sandbox docs don't appear in production responses (or vice versa)
- Production rejects requests that sandbox accepted

**Prevention strategy:**
- Treat sandbox as "prototype environment" and production as the source of truth for field definitions
- Before each production deploy: run a side-by-side comparison of API responses (same endpoint, sandbox vs. prod) and diff the shapes
- Keep a field-level changelog: when you discover a field in production that doesn't exist in sandbox, document it in `docs/appfolio-field-notes.md`
- Never rely on sandbox acceptance as production readiness proof. Use a canary run strategy: first production execution of any new flow is always Quest-gated (human approval required, regardless of autonomy level)

**Phase:** Phase 1 (sandbox testing) and Phase 2 (first production deployment). Document divergences as they are found and maintain that document throughout all phases.

---

### Pitfall 1.3: Pagination Cache Expiry Breaks Report Reads Mid-Sequence

**What goes wrong:** AppFolio's Reporting v2 API paginates at 5,000 rows. The `next_page_url` references a server-side cache that expires after 30 minutes. If an automation pauses between pages (waiting on another operation, sleeping on rate limits, or the user closing the browser), the cached result expires and subsequent page fetches return errors requiring a full re-run.

**Why it happens:** The cache is server-side and not under the client's control. Multi-step workflows that interleave reading and writing are especially vulnerable.

**Consequences:** Incomplete reads of unit lists, vendor lists, or existing work orders — automation proceeds with a partial data set and may create records based on stale or missing data.

**Warning signs:**
- Pagination errors that only appear on large portfolios
- Intermittent failures when reading data that takes more than 20-25 minutes to process

**Prevention strategy:**
- Complete all reads before beginning any writes in a workflow — never interleave
- If a read phase may take longer than 20 minutes, implement re-fetch-from-start recovery logic
- Add pagination timing metrics to logs so long reads are visible
- For the unit turn flow specifically: read all required data (unit record, existing work orders, vendor list) into memory first, validate completeness, then enter the write phase

**Phase:** Phase 1. Build the read-then-write pattern from the start — it is harder to retrofit later.

---

### Pitfall 1.4: Purchase Order API Gap Is Unresolved — Fallback Strategy Not Ready

**What goes wrong:** Purchase orders are not documented in the AppFolio API as of the time of this research. There is a possibility they can be represented as a different record type. If this gap is not resolved before building the unit turn automation, you will reach the PO creation step with no working path. Defaulting to browser automation without a pre-built fallback architecture will force a partial rewrite.

**Why it happens:** AppFolio's API coverage is genuinely incomplete — this is a known constraint from the project brief.

**Consequences:** PO creation step blocks the automation entirely, or a browser automation fallback is bolted on in a way that is tightly coupled to the business logic, making it hard to swap out later when/if an API path is found.

**Warning signs:**
- AppFolio support has not confirmed a documented API path for POs after initial inquiry
- Searching the API spec finds no `purchase_orders` or equivalent endpoint

**Prevention strategy:**
- Architect the execution layer with a `PurchaseOrderStrategy` abstraction from day one. The strategy interface accepts inputs and either calls the API or drives the browser — business logic does not know which one runs
- Build the API path first (even if speculative), confirm or deny through actual API calls, then build the browser automation path as the fallback behind the same interface
- Browser automation scope: use Playwright, target by ARIA labels and text rather than CSS selectors or XPath (more resilient to UI changes)
- Set a deadline for the PO API question: if no resolution within 2 weeks of starting Phase 1, treat the browser path as primary and plan accordingly

**Phase:** Phase 1 architecture. The abstraction layer must exist before either path is implemented.

---

### Pitfall 1.5: Missing or Wrong Unit Eligibility Validation Creates Bad Records

**What goes wrong:** The AppFolio unit turn API requires the unit to be in a specific state (e.g., vacant, on a unit turn board) to accept a unit turn work order. Passing a unit that is occupied, already has an open unit turn, or does not meet eligibility requirements either returns an error with an unhelpful message or silently creates a malformed record.

**Why it happens:** AppFolio enforces business rules server-side that are not fully documented. Eligibility rules were previously discovered through trial and error (per project memory).

**Consequences:** Automation attempts to create work orders for ineligible units, fails mid-sequence after creating some records but not others, leaving the system in a partial state.

**Warning signs:**
- 422 or 400 responses mid-sequence with generic error messages
- Work orders created for some categories but not others on the same unit

**Prevention strategy:**
- Add an explicit pre-flight eligibility check before the Quest approval step — validate the unit's current state before ever showing the user an approval screen
- If pre-flight fails, surface the reason clearly in the UI ("Unit 4B is currently occupied — unit turns require a vacant unit")
- Document discovered eligibility rules in `docs/appfolio-field-notes.md` as they are found
- Never show a Quest approval for an action that has already failed pre-flight validation

**Phase:** Phase 1 (unit selector + Quest flow). The pre-flight check is part of the Quest step, not an afterthought.

---

## Category 2: Automation Reliability Pitfalls

---

### Pitfall 2.1: Partial Failure Mid-Sequence Leaves AppFolio in a Corrupted State

**What goes wrong:** A unit turn creates N work orders in sequence. If the sequence fails on work order 3 of 6 (network timeout, rate limit, AppFolio 500 error), work orders 1 and 2 now exist in AppFolio without the others. The user has no way to know what was and wasn't created. Running the automation again creates duplicates for the first two.

**Why it happens:** Multi-step write sequences across an external API are inherently non-atomic. AppFolio provides no transaction or rollback mechanism.

**Consequences:** Duplicate work orders in AppFolio, inconsistent work order sets, vendor confusion, potential duplicate billing on the same unit turn.

**Warning signs:**
- Any automation flow that calls a write API more than once per execution
- No idempotency key or existence check before each write

**Prevention strategy:**
- Before each write: check whether a record with that identity (unit ID + category + turn ID) already exists in AppFolio. Only write if not present.
- After each successful write: persist the result to the platform's own execution state store (database row or file). This is the "completed steps" record.
- On resume/retry: start from the first incomplete step, not from scratch
- Log each step as: PENDING → IN_PROGRESS → COMPLETE (or FAILED with reason). This state machine is visible in the execution log.
- Surface partial failures in the UI explicitly: "3 of 6 work orders created. Automation paused due to error on step 4. Resume or rollback?"

**Phase:** Phase 1. The state machine pattern must be built into the execution engine before any production use.

---

### Pitfall 2.2: No Idempotency Keys on Write Operations

**What goes wrong:** A network timeout on a POST request may mean the AppFolio server received and processed the request but the response was lost. A naive retry creates a duplicate record. This is especially dangerous for purchase orders (if created via API) and work orders, because duplicates flow downstream into vendor billing.

**Why it happens:** Most developers build happy-path first. Idempotency is added only after a duplicate incident.

**Consequences:** Duplicate work orders, duplicate POs, double-billing vendors, client accounting discrepancies.

**Warning signs:**
- POST requests without an idempotency key header (or equivalent)
- Retry logic that re-sends the same POST body without first checking for existing records

**Prevention strategy:**
- Before every POST to create a record: query for an existing record matching the logical identity (unit + category + date range for work orders)
- If found: skip creation, log "record already existed, skipping", continue
- If not found: create, then log the newly created record ID
- Build this "check-then-create" wrapper as a reusable function in the API client layer — not duplicated inline in each automation step

**Phase:** Phase 1. Every write must go through this wrapper from the first implementation.

---

### Pitfall 2.3: Retry Logic That Retries Non-Retriable Errors

**What goes wrong:** A retry loop that retries all failures will retry 400 (bad request), 404 (not found), and 422 (validation error) responses indefinitely. These errors will not resolve on retry — they indicate a logic error or invalid input. Retrying them wastes time, generates noise in logs, and delays surfacing the real problem to the user.

**Why it happens:** Generic retry logic ("retry on any non-200") is faster to write than discriminating retry logic.

**Consequences:** Automation hangs or spins on a fixable configuration problem, user sees no meaningful feedback, operator misses the real error buried in retry noise.

**Warning signs:**
- Retry logic that doesn't distinguish 4xx from 5xx
- Logs showing the same 400 error repeated 3 times before giving up

**Prevention strategy:**
- Only retry: 429 (rate limit — with backoff), 500 (server error — with backoff), network timeouts
- Never retry: 400, 401, 403, 404, 406, 422 — surface these immediately as actionable errors with plain-language descriptions
- Map known error codes to user-facing messages: `422 on work order creation = "Unit is not eligible for a unit turn. Check unit status in AppFolio."`

**Phase:** Phase 1 (API client implementation).

---

## Category 3: Data Integrity Pitfalls

---

### Pitfall 3.1: Duplicate Work Orders Corrupt Vendor PO Matching

**What goes wrong:** Two work orders for the same scope on the same unit turn exist simultaneously — one from a previous partial run, one from a fresh run. When purchase orders are generated by grouping work orders per vendor, the vendor receives a PO referencing two WOs for the same work. Vendor does the work once, invoices twice (or once against each PO), and the client's accounting shows double the cost.

**Why it happens:** No pre-creation existence check + no idempotency on retries (see 2.1 and 2.2 above), compounded by the fact that AppFolio does not prevent creating two work orders for the same category on the same unit turn.

**Consequences:** Inflated vendor costs, accounting entries that don't reconcile, and a manual correction process inside AppFolio that is time-consuming and error-prone.

**Warning signs:**
- No duplicate check in the work order creation flow
- Ability to trigger the same automation twice on the same unit without guard rails

**Prevention strategy:**
- Add a guard at the automation entry point: if an execution record already exists for this unit + date, present the user with the existing run status rather than starting a new one
- Before creating any work order: query AppFolio for existing work orders on this unit turn with this category. Block creation if one already exists, log the skip.
- Expose duplicate detection in the Quest preview: "Work order for Paint already exists (WO #12345). This scope will be skipped."

**Phase:** Phase 1. This must be part of the Quest pre-execution preview logic, not a post-creation check.

---

### Pitfall 3.2: Scope Matrix Misconfiguration Silently Creates Wrong Records

**What goes wrong:** The scope-to-category-to-vendor matrix is the configuration layer driving all automation inputs. If this mapping contains an error (wrong vendor ID, wrong category name, a scope assigned to two categories), the automation creates valid API records with wrong data. AppFolio accepts them without complaint. The client discovers the error only when a vendor questions why they received a PO for work they don't do.

**Why it happens:** External configuration files allow non-developer edits, which is the right call for flexibility — but also allows invalid data to enter the system without validation.

**Consequences:** Wrong vendors receive work orders, work is assigned to incorrect categories, POs go to the wrong vendor, accounting entries are miscategorized.

**Warning signs:**
- Scope matrix has no schema validation
- Client can edit the matrix without any preview of what automations would be affected

**Prevention strategy:**
- Validate the scope matrix at load time against a strict schema: every scope must have exactly one category, every category must have exactly one vendor ID, every vendor ID must resolve to a real AppFolio vendor
- Vendor ID validation: on startup (or matrix reload), hit the AppFolio vendor endpoint to confirm each mapped vendor ID exists and is active
- Surface validation errors in the UI before the matrix is saved, not at automation runtime
- In the Quest preview: show "Scope: Paint → Category: Interior Paint → Vendor: ABC Painting Co. (Vendor ID: 12345)" so the user can catch wrong assignments before approving

**Phase:** Phase 1 (scope matrix + Quest preview). Validation logic is part of the matrix editor and Quest screen, not optional.

---

### Pitfall 3.3: Creating Records Against the Wrong Property or Unit

**What goes wrong:** The unit selector returns AppFolio unit IDs. If the selector UI allows selecting a unit from the wrong property (e.g., the user searches "4B" and picks the first result, which is a different property's unit 4B), all subsequent work orders and POs are created under the wrong property. AppFolio has no cross-property duplicate detection.

**Why it happens:** Unit searches without property context return ambiguous results, especially in a multi-property portfolio.

**Consequences:** Work orders attached to the wrong property, POs referencing the wrong unit, client invoices posted to the wrong property's accounts.

**Warning signs:**
- Unit selector shows search results without property name
- No confirmation screen showing full "Property > Unit" context before proceeding

**Prevention strategy:**
- Always display and require selection of property first, then unit within that property — never allow free-text unit search across all properties
- Quest preview must display the full path: "Property: 123 Main St → Unit: 4B" and require the user to confirm it matches their intent
- Log the property ID alongside every unit ID in all execution records

**Phase:** Phase 1 (unit selector UI and Quest screen design).

---

## Category 4: Portal UX Pitfalls

---

### Pitfall 4.1: Quest Approval Becomes a Rubber-Stamp Click-Through

**What goes wrong:** The Quest approval screen is designed as a meaningful review step. If it presents too much information, requires too many clicks, or appears identically for every run, users learn to click Approve without reading it. The safety mechanism becomes theater.

**Why it happens:** Information density is hard to calibrate. Developers tend to "show everything" because it feels safer. Users optimize for throughput over review quality when they are busy.

**Consequences:** User approves a run with a wrong vendor mapping or wrong unit without noticing. The automation executes. The error reaches AppFolio. Now it must be manually corrected.

**Warning signs:**
- Quest screen has more than 6-8 lines of information before the Approve/Reject buttons
- Every Quest screen looks the same regardless of input — no callouts for anything unusual
- Users report clicking Approve without knowing what they approved

**Prevention strategy:**
- Structure the Quest screen as a tiered summary: Lead with the most important fact ("Creating 5 work orders on Unit 4B, 123 Main St"), then show detail on expand
- Highlight differences from a "standard" run: if a vendor has changed, or a scope is new, or a unit has an unusual status — surface this with a visual callout, not buried in a list
- Show the count of actions prominently ("5 work orders + 2 purchase orders will be created")
- Keep the approve button below the summary but above the detail — user must see the summary, detail is optional
- Track approval-to-review-time ratio in logs: if users are approving in under 5 seconds, the screen isn't being read

**Phase:** Phase 1 (Quest screen design). The initial design matters — habits form on the first 20 uses.

---

### Pitfall 4.2: Execution Logs Are Unreadable by Non-Technical Users

**What goes wrong:** The activity log records technical state: API call URLs, HTTP response codes, JSON payloads, internal IDs. The client's team reads it and cannot understand what happened. They escalate to the developer to interpret logs for every question. The log's purpose — making automation transparent — fails.

**Why it happens:** It is faster to log raw API responses than to write human-readable event descriptions.

**Consequences:** Log exists but is not used by the intended audience. When something goes wrong, the client cannot self-diagnose. Developer becomes a log interpreter, which is not a scalable role.

**Warning signs:**
- Log entries read like: `POST /api/v1/work_orders → 201, id: 8821`
- No natural-language description of what the step accomplished
- Internal IDs in logs with no cross-reference to human-readable names

**Prevention strategy:**
- Every logged event must have a human-readable description as the primary text: "Created work order for Paint on Unit 4B — Vendor: ABC Painting Co. (WO #8821)"
- Internal details (API URL, request body, response code) go in a collapsible "Technical Details" section visible to developers, hidden by default from non-technical view
- Two log modes: Summary view (default, plain English) and Debug view (all technical details)
- All names, not IDs: the log records vendor name, unit address, category name — not IDs. IDs are in the technical detail section.

**Phase:** Phase 1. Every log entry written from the start must follow the human-readable format. It is not a feature to add later.

---

### Pitfall 4.3: Notification Fatigue Causes the Quest Inbox to Go Unread

**What goes wrong:** Every automation generates a Quest approval request. If approvals accumulate (e.g., three unit turns queued while the owner was traveling), the inbox fills up. Users see 12 pending approvals and start batch-approving without reading any of them — defeating the purpose.

**Why it happens:** High approval volume with no prioritization or batching mechanism.

**Consequences:** Approvals rubber-stamped in bulk, same problem as Pitfall 4.1 but at scale.

**Warning signs:**
- More than 3-4 Quests queued at one time regularly
- Users report the inbox as a source of stress rather than control

**Prevention strategy:**
- Surface Quest urgency: flag time-sensitive approvals (e.g., move-out deadline approaching) differently from non-urgent ones
- Allow bulk review with diff highlighting: "These 3 unit turns all use the same vendors and scopes — one-click approve all, or review individually"
- Add a "snooze" mechanism: the user can explicitly defer a Quest to a chosen date/time
- Design the inbox for scannability: each Quest shows Property, Unit, Action Type, and one-line summary — no need to open to understand what it is

**Phase:** Phase 2 (when multiple automations or higher frequency use begins). Phase 1 can be basic — address inbox management before enabling autonomous execution.

---

## Category 5: Architecture Pitfalls

---

### Pitfall 5.1: Business Logic Coupled Directly to AppFolio API Calls

**What goes wrong:** The automation logic that determines "which work orders to create for this unit turn" is written inline with the AppFolio API calls that create them. When AppFolio changes an endpoint, field name, or behavior, the business logic must be rewritten alongside the API integration.

**Why it happens:** Fastest path to a working prototype is to write the logic and the API call in the same function.

**Consequences:** Any AppFolio API change requires touching business logic. The known sandbox/production divergence becomes a constant source of fear. A switch to browser automation for POs requires finding and changing all the places where PO logic is embedded in API calls.

**Warning signs:**
- A function named `createUnitTurnWorkOrders` that contains both "which categories apply" logic and `await appfolioApi.post('/work_orders', ...)`
- No clear boundary in the codebase between "what to do" and "how to tell AppFolio"

**Prevention strategy:**
- Enforce a three-layer separation: (1) Business Logic layer — determines what needs to happen given inputs; (2) Command layer — translates business decisions into abstract commands (`CreateWorkOrder`, `CreatePurchaseOrder`); (3) Execution layer — receives commands and calls AppFolio API or browser automation
- The execution layer is the only place AppFolio API endpoints and field names appear
- The business logic layer never imports the API client
- Test the business logic layer independently with mock command outputs

**Phase:** Phase 1 (architecture). This separation is the single most important architectural decision. It prevents every category of AppFolio-change-induced breakage.

---

### Pitfall 5.2: Browser Automation Fallback Coupled to AppFolio UI Structure

**What goes wrong:** If Playwright browser automation is needed for PO creation, scripts that target CSS selectors like `.purchase-order-button` or `div.table-row:nth-child(3)` break every time AppFolio updates their UI. These updates can happen with no warning.

**Why it happens:** CSS selector targeting is the default approach most developers use first.

**Consequences:** PO creation breaks silently in production after an AppFolio UI update. The next PO run fails. The first sign is a client complaint.

**Warning signs:**
- Playwright scripts using CSS class selectors, position-based selectors, or XPath
- No monitoring on browser automation runs beyond pass/fail

**Prevention strategy:**
- Target exclusively by: ARIA labels, `data-testid` attributes (if AppFolio uses them), visible text content, and semantic roles — not CSS classes or positions
- Add screenshot capture on every step in non-production runs — visual diff against a baseline image catches UI changes before they become production failures
- Wrap browser automation in a canary check: after each AppFolio update or on a weekly schedule, run a smoke test that confirms the target UI elements still exist
- The browser automation path is explicitly a fallback — invest the minimum necessary and document that it is high-maintenance

**Phase:** Phase 1 if browser automation is needed for POs. The resilient locator strategy must be established before writing the first selector.

---

### Pitfall 5.3: Scope Matrix Hardcoded or Stored in Code

**What goes wrong:** The scope-to-category-to-vendor mapping is embedded in code or a committed configuration file. The client needs to add a scope (e.g., "HVAC Cleaning") or change a vendor assignment. This requires a developer code change, a deploy, and a code review cycle — for what is conceptually a business configuration change.

**Why it happens:** Fastest implementation is to put the mapping in a constant or config file.

**Consequences:** Client cannot self-serve configuration changes, developer is a bottleneck for every scope addition, velocity of configuration iteration is very slow.

**Warning signs:**
- Scope matrix is in a `.ts` or `.json` file in the repo
- Adding a new scope requires a pull request

**Prevention strategy:**
- Store the scope matrix in the application database from day one
- Provide a UI for reading and editing the matrix (can be basic — a table with inline edit)
- Validate the matrix on save (see Pitfall 3.2)
- Treat it as data, not code — no deployment required to change a vendor assignment

**Phase:** Phase 1. The data model and UI surface must exist before the client begins using the system. If it is not configurable at launch, the developer immediately becomes the configuration bottleneck.

---

## Category 6: Phased Autonomy Pitfalls

---

### Pitfall 6.1: Graduating to Autonomous Execution Before Trust Is Established

**What goes wrong:** Automation works flawlessly in Phase 1 (human-gated). The client asks to remove approvals for "simple" unit turns. The first autonomous run has a subtle scope matrix misconfiguration — a new vendor was added but the ID was typed wrong. The automation silently creates 6 work orders referencing a non-existent vendor. No one reviews the Quest because it was disabled. The client discovers this when a vendor calls asking about a PO they never received.

**Why it happens:** Automation success creates overconfidence. The value of human gates is only visible in the moments they catch an error.

**Consequences:** Trust erosion is asymmetric — one early automation error produces a steep, prolonged drop in trust that is very difficult to recover. The earlier in the product lifecycle the error occurs, the worse the impact (confirmed by autonomy trust research).

**Warning signs:**
- Client requests autonomous execution before the system has been running for at least 30 days with 100% Quest approval rate
- No mechanism to re-enable Quest approval for a specific automation type without developer involvement
- "Autonomy level" is a binary on/off, not configurable per automation type or per condition

**Prevention strategy:**
- Define explicit autonomy graduation criteria before building Phase 2: e.g., "30 consecutive Quest approvals with zero rejections, zero manual corrections, zero reported errors"
- Autonomy level is configurable per automation type AND per condition: a unit turn with all familiar vendors on a fully validated unit can run at Level 2; a unit turn with a new vendor or an unusual unit state always requires Level 1 approval
- Build the autonomy level control into the portal UI from Phase 1 — even if only Level 1 is active, the dial must exist so it can be turned up without a code change
- Every autonomous run still logs a Quest-equivalent event: "This would have shown you this Quest — here is what it would have said." The user can review in retrospect.

**Phase:** Phase 1 (design the dial), Phase 2 (graduate to Level 2 for specific conditions only), Phase 3 (Level 3 for proven patterns).

---

### Pitfall 6.2: No Rollback Path for Automation Errors

**What goes wrong:** An automation creates 6 work orders and 2 purchase orders incorrectly. The user wants to undo the run. There is no "rollback" button. The user must manually find and delete each record in AppFolio — assuming AppFolio even allows deletion (it may not, for records that have been invoiced).

**Why it happens:** Rollback is complex to implement and is skipped in v1 in favor of moving fast.

**Consequences:** Incorrect records persist in AppFolio. Manual correction is slow and error-prone. Client's accounting team must be involved. Trust in the system is damaged.

**Warning signs:**
- No inverse operation defined for any automation step
- Execution log does not record the IDs of every created record

**Prevention strategy:**
- Every execution run records the full list of created record IDs in the platform's own database — this is the rollback manifest
- Build a "Request Reversal" workflow: user clicks "Reverse This Run" → system shows what it will attempt to delete → user approves → system attempts deletion via AppFolio API and logs the results
- Document AppFolio's deletion constraints explicitly: some record types cannot be deleted once in a certain state (e.g., a WO that has been invoiced). The rollback flow must handle this gracefully: "Work Order #8821 cannot be deleted — it has been invoiced. Manual action required in AppFolio."
- The reversal workflow does not need to be fully automated in Phase 1 — a clear rollback manifest (list of created IDs) is sufficient, so a human can execute reversals manually with all needed information in front of them

**Phase:** Phase 1 must produce the rollback manifest. Full automated reversal can be Phase 2.

---

### Pitfall 6.3: Automation Errors With No Clear Owner or Escalation Path

**What goes wrong:** An automation fails at 11pm. No one is notified. The failure is discovered the next morning when a vendor calls about a missing PO. The execution log exists but nobody checked it. There is no on-call process, no alerting, no defined escalation owner.

**Why it happens:** Phase 1 is small-team. Alerting seems over-engineered for a 10-user system.

**Consequences:** Silent failures accumulate. Partial records sit in AppFolio uncorrected. Client trust degrades.

**Warning signs:**
- No alerting or notification on automation failure
- Log is passive — requires user to actively open it
- No clear policy for who handles automation errors

**Prevention strategy:**
- On any automation failure: push a notification to the Quest inbox with a plain-language description of what failed and what state AppFolio is in
- Quest inbox items for failures are flagged as "Requires Action" and appear at the top, above pending approvals
- Define the failure owner in the operational runbook: who receives error notifications, what the response SLA is, who has access to manually correct AppFolio records
- Do not rely on users checking the log — failures must push to the user, not wait to be discovered

**Phase:** Phase 1. Passive logging is not sufficient from day one of production use.

---

## Phase-Specific Warning Summary

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|----------------|------------|
| First AppFolio API call | Undocumented rate limits (1.1) | Build rate-limit-aware request queue from first call |
| Unit selector UI | Wrong unit/property selection (3.3) | Property-first selection, Quest confirms full path |
| Quest screen design | Rubber-stamp approval (4.1) | Tiered summary, callouts for unusual conditions |
| Scope matrix initial setup | Misconfiguration creates wrong records (3.2) | Schema validation + vendor ID verification on load |
| First production deploy | Sandbox/production divergence (1.2) | Side-by-side field comparison before deploy |
| PO creation path | Unresolved API gap + brittle browser fallback (1.4, 5.2) | Strategy abstraction layer + ARIA-based selectors |
| Execution engine design | Partial failure, no idempotency (2.1, 2.2) | State machine + check-before-write on every API call |
| Autonomy level graduation | Moving too fast, trust erosion (6.1) | Explicit graduation criteria + per-condition autonomy levels |
| First autonomous run | No rollback, silent failure (6.2, 6.3) | Rollback manifest + active failure notifications |

---

## Sources

- [AppFolio Reporting v2 API Documentation (GitHub gist, omnimaxxing)](https://gist.github.com/omnimaxxing/2b016c518b4063fd536549b12694b7b7) — Rate limits, pagination behavior, error codes (HIGH confidence)
- [AppFolio Stack Partner API](https://www.appfolio.com/stack/partners/api) — API program scope and restrictions (HIGH confidence)
- [Using the AppFolio API with JavaScript — Endgrate](https://endgrate.com/blog/using-the-appfolio-api-to-get-report-(with-javascript-examples)) — Rate limit undocumented status, defensive coding recommendations (MEDIUM confidence)
- [Building APIs That Delight Customers — AppFolio Engineering Blog](https://engineering.appfolio.com/appfolio-engineering/2022/12/19/building-apis-that-delight-customers-and-developers) — AppFolio's API versioning approach and partner communication model (MEDIUM confidence)
- [Common Approval Workflow Mistakes — SnohAI](https://snohai.com/common-approval-workflow-mistakes-enterprises-make/) — Approval UX failure patterns (MEDIUM confidence)
- [Building Trust in Agentic Tools — GitLab](https://about.gitlab.com/blog/building-trust-in-agentic-tools-what-we-learned-from-our-users/) — Phased autonomy trust-building patterns (HIGH confidence)
- [Trust in Automation Framework — ResearchGate](https://www.researchgate.net/publication/317071041_Building_a_framework_to_manage_trust_in_automation) — Error timing and trust erosion severity (HIGH confidence, academic)
- [Idempotency in Software — ByteByteGo](https://blog.bytebytego.com/p/mastering-idempotency-building-reliable) — Idempotency patterns for reliable APIs (HIGH confidence)
- [Why Playwright Sucks for End-to-End Tests — testRigor](https://testrigor.com/blog/why-playwright-sucks-for-end-to-end-tests/) — Browser automation maintenance cost and fragility (MEDIUM confidence)
- [MuleSoft Idempotent Integration Flows — iMarkInfotech](https://www.imarkinfotech.com/salesforce/blogs/mulesoft-consulting-designing-idempotent-integration-flows/) — Idempotency key patterns in integration workflows (MEDIUM confidence)
- Project context: `.planning/PROJECT.md` — Known AppFolio constraints, sandbox/production divergence, PO API gap, client data integrity concerns (HIGH confidence — primary source)
