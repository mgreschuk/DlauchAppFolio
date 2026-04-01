import { pgTable, uuid, text, varchar, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";

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

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

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
  id: uuid("id").primaryKey().defaultRandom(),
  /** Type of request, e.g. "connectivity_check", "unit_turn", "work_order_create" */
  requestType: varchar("request_type", { length: 100 }).notNull(),
  /** Plain-language description of what was requested (D-08) */
  description: text("description").notNull(),
  /** Structured input parameters captured at request time */
  inputs: jsonb("inputs"),
  /** What the automation planned to do (shown in Quest approval UI) */
  plannedActions: jsonb("planned_actions"),
  /** Expected results of the automation */
  expectedOutputs: jsonb("expected_outputs"),
  /** Lifecycle status */
  status: activityLogStatusEnum("status").notNull().default("pending"),
  /** Human-readable outcome summary — plain language, no stack traces (D-08) */
  outcomeNotes: text("outcome_notes"),
  /** Related AppFolio unit ID, if applicable */
  unitId: varchar("unit_id", { length: 100 }),
  /** Related scope matrix entry, if applicable */
  scopeId: uuid("scope_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
