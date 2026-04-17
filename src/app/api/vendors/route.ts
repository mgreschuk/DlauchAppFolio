import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { vendors } from "@/db/schema";

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(vendors)
      .orderBy(asc(vendors.name));

    return NextResponse.json(rows);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
