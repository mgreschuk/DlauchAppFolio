import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
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

const addVendorSchema = z.object({
  name: z.string().min(1).max(255),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = addVendorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    // Manual vendors get a generated ID prefixed with "manual-" to distinguish from AppFolio IDs
    const manualId = `manual-${Date.now()}`;

    const [newVendor] = await db
      .insert(vendors)
      .values({
        appfolioId: manualId,
        name: parsed.data.name,
        syncedAt: new Date(),
      })
      .returning();

    return NextResponse.json(newVendor, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message.toLowerCase() : String(err);
    if (message.includes("duplicate key") || message.includes("unique constraint")) {
      return NextResponse.json(
        { error: "A vendor with this name already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
