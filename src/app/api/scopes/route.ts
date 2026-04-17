import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { scopes } from "@/db/schema";

const createScopeSchema = z.object({
  scopeName: z.string().min(1).max(255),
  category: z.string().min(1).max(255),
  vendor: z.string().min(1).max(255),
  vendorId: z.string().max(100).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const includeInactive =
      request.nextUrl.searchParams.get("includeInactive") === "true";

    const rows = includeInactive
      ? await db.select().from(scopes).orderBy(asc(scopes.scopeName))
      : await db
          .select()
          .from(scopes)
          .where(eq(scopes.isActive, true))
          .orderBy(asc(scopes.scopeName));

    return NextResponse.json(rows);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createScopeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { scopeName, category, vendor, vendorId } = parsed.data;

    const [newScope] = await db
      .insert(scopes)
      .values({ scopeName, category, vendor, vendorId: vendorId ?? null })
      .returning();

    return NextResponse.json(newScope, { status: 201 });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message.toLowerCase() : String(err);
    if (message.includes("duplicate key") || message.includes("unique constraint")) {
      return NextResponse.json(
        { error: "A scope with this name already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
