import { db } from "@/db";
import { activityLog } from "@/db/schema";

/**
 * Write a structured entry to the activity log (LOG-01, D-06).
 *
 * The activity log is the "job board for employees" — non-technical users read these
 * entries in the portal. Per D-08: descriptions and outcome_notes must be in plain
 * language. Never write stack traces, internal IDs, or technical error details.
 *
 * In Phase 1, this function is called for AppFolio connectivity check results (D-07).
 * The Quest approval flow (pending/approved/rejected) is exercised in Phase 3.
 *
 * @returns The ID of the created log entry
 */
export async function writeActivityLog(entry: {
  requestType: string;
  description: string;
  inputs?: Record<string, unknown>;
  plannedActions?: Record<string, unknown>;
  expectedOutputs?: Record<string, unknown>;
  status: "pending" | "approved" | "rejected" | "completed" | "failed";
  outcomeNotes?: string;
  unitId?: string;
  scopeId?: string;
}): Promise<string> {
  const [result] = await db
    .insert(activityLog)
    .values({
      requestType: entry.requestType,
      description: entry.description,
      inputs: entry.inputs ?? null,
      plannedActions: entry.plannedActions ?? null,
      expectedOutputs: entry.expectedOutputs ?? null,
      status: entry.status,
      outcomeNotes: entry.outcomeNotes ?? null,
      unitId: entry.unitId ?? null,
      scopeId: entry.scopeId ?? null,
    })
    .returning({ id: activityLog.id });
  return result.id;
}
