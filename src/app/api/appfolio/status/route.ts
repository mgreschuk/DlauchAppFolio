import { NextResponse } from "next/server";
import { AppFolioApiClient } from "@/lib/appfolio/api-client";
import { writeActivityLog } from "@/lib/activity-log";

export async function GET() {
  const client = new AppFolioApiClient({
    baseUrl: process.env.APPFOLIO_BASE_URL ?? "https://api.appfolio.com",
    clientId: process.env.APPFOLIO_CLIENT_ID ?? "",
    clientSecret: process.env.APPFOLIO_CLIENT_SECRET ?? "",
    databaseId: process.env.APPFOLIO_DATABASE_ID ?? "",
  });

  const result = await client.testConnection();

  // Write activity log entry per D-07 — connectivity check is the only real log in Phase 1
  await writeActivityLog({
    requestType: "appfolio_connectivity_check",
    description: result.connected
      ? "AppFolio sandbox connection verified successfully."
      : `AppFolio sandbox connection failed: ${result.error}`,
    status: result.connected ? "completed" : "failed",
    outcomeNotes: result.connected
      ? "API responded successfully. Sandbox is reachable."
      : `Connection error: ${result.error}. Check API credentials in environment config.`,
  });

  return NextResponse.json({
    connected: result.connected,
    error: result.error,
    checkedAt: new Date().toISOString(),
  });
}
