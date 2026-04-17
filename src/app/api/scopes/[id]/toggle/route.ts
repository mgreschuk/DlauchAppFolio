import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { scopes } from "@/db/schema";

export async function PATCH(
  _req: NextRequest,
  ctx: RouteContext<"/api/scopes/[id]/toggle">
) {
  try {
    const { id } = await ctx.params;

    const rows = await db.select().from(scopes).where(eq(scopes.id, id));

    if (rows.length === 0) {
      return NextResponse.json({ error: "Scope not found" }, { status: 404 });
    }

    const currentScope = rows[0];

    const updated = await db
      .update(scopes)
      .set({ isActive: !currentScope.isActive, updatedAt: new Date() })
      .where(eq(scopes.id, id))
      .returning();

    return NextResponse.json(updated[0]);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
