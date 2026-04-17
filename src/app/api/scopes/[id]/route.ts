import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { scopes } from "@/db/schema";

const updateScopeSchema = z.object({
  scopeName: z.string().min(1).max(255).optional(),
  category: z.string().min(1).max(255).optional(),
  vendor: z.string().min(1).max(255).optional(),
  vendorId: z.string().max(100).optional(),
});

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/scopes/[id]">
) {
  try {
    const { id } = await ctx.params;

    const rows = await db.select().from(scopes).where(eq(scopes.id, id));

    if (rows.length === 0) {
      return NextResponse.json({ error: "Scope not found" }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  ctx: RouteContext<"/api/scopes/[id]">
) {
  try {
    const { id } = await ctx.params;

    const body = await request.json();
    const parsed = updateScopeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const updated = await db
      .update(scopes)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(scopes.id, id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: "Scope not found" }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
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
