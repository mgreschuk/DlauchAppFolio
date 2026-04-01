import { pgTable, uuid, text, varchar, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";

export const activityStatusEnum = pgEnum("activity_status", [
  "pending", "approved", "rejected", "completed", "failed"
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const activityLog = pgTable("activity_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestType: varchar("request_type", { length: 100 }).notNull(),
  description: text("description").notNull(),
  inputs: jsonb("inputs"),
  plannedActions: jsonb("planned_actions"),
  expectedOutputs: jsonb("expected_outputs"),
  status: activityStatusEnum("status").notNull().default("pending"),
  outcomeNotes: text("outcome_notes"),
  unitId: varchar("unit_id", { length: 100 }),
  scopeId: uuid("scope_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
