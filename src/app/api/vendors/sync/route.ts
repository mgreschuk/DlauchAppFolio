import { NextResponse } from "next/server";
import { db } from "@/db";
import { vendors } from "@/db/schema";
import { AppFolioApiClient } from "@/lib/appfolio/api-client";

export async function POST() {
  try {
    const client = new AppFolioApiClient({
      baseUrl: process.env.APPFOLIO_BASE_URL ?? "https://api.appfolio.com",
      clientId: process.env.APPFOLIO_CLIENT_ID ?? "",
      clientSecret: process.env.APPFOLIO_CLIENT_SECRET ?? "",
      developerId: process.env.APPFOLIO_DEV_ID,
    });

    const appFolioVendors = await client.getVendors();

    if (appFolioVendors.length === 0) {
      return NextResponse.json(
        { error: "No vendors returned from AppFolio — check connection" },
        { status: 502 }
      );
    }

    // Upsert: insert new vendors, update names on conflict
    const now = new Date();
    let synced = 0;

    for (const v of appFolioVendors) {
      await db
        .insert(vendors)
        .values({
          appfolioId: v.id,
          name: v.name,
          syncedAt: now,
        })
        .onConflictDoUpdate({
          target: vendors.appfolioId,
          set: { name: v.name, syncedAt: now },
        });
      synced++;
    }

    return NextResponse.json({
      synced,
      syncedAt: now.toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to sync vendors from AppFolio", detail: message },
      { status: 502 }
    );
  }
}
