import { NextResponse } from "next/server";
import { AppFolioApiClient } from "@/lib/appfolio/api-client";

export async function GET() {
  try {
    const client = new AppFolioApiClient({
      baseUrl: process.env.APPFOLIO_BASE_URL ?? "https://api.appfolio.com",
      clientId: process.env.APPFOLIO_CLIENT_ID ?? "",
      clientSecret: process.env.APPFOLIO_CLIENT_SECRET ?? "",
      developerId: process.env.APPFOLIO_DEV_ID,
    });

    const vendors = await client.getVendors();
    return NextResponse.json(vendors);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch vendors from AppFolio", detail: message },
      { status: 502 }
    );
  }
}
