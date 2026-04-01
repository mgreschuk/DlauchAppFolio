import { pgTable, text, jsonb, timestamp, pgEnum } from "drizzle-orm/pg-core";

/**
 * Activity log status enum (D-06).
 * Tracks lifecycle of automation requests from initial submission through completion.
 */
export const activityLogStatusEnum = pgEnum("activity_log_status", [
  "pending",
  "approved",
  "rejected",
  "completed",
  "failed",
]);

/**
 * Activity log table (D-06, LOG-01).
 *
 * Structured record of all automation activity. Designed for non-technical users
 * (D-08): plain language in description/planned_actions/outcome_notes — no stack
 * traces or internal IDs surfaced to the user.
 *
 * In Phase 1, entries are written for AppFolio connectivity checks (D-07).
 * Full Quest approval flow (pending/approved/rejected) activates in Phase 3.
 */
export const activityLog = pgTable("activity_log", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  /** Type of request, e.g. "connectivity_check", "unit_turn", "work_order_create" */
  requestType: text("request_type").notNull(),
  /** Plain-language description of what was requested (D-08) */
  description: text("description").notNull(),
  /** Structured input parameters captured at request time */
  inputs: jsonb("inputs"),
  /** What the automation planned to do (shown in Quest approval UI) */
  plannedActions: jsonb("planned_actions"),
  /** Expected results of the automation */
  expectedOutputs: jsonb("expected_outputs"),
  /** Lifecycle status */
  status: activityLogStatusEnum("status").notNull(),
  /** Human-readable outcome summary — plain language, no stack traces (D-08) */
  outcomeNotes: text("outcome_notes"),
  /** Related AppFolio unit ID, if applicable */
  unitId: text("unit_id"),
  /** Related scope matrix entry, if applicable */
  scopeId: text("scope_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .$defaultFn(() => new Date()),
});
