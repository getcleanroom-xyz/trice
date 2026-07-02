import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { layoutPreferences } from "@/lib/db/schema";

const layoutItemSchema = z.object({
  i: z.string(),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
});
const bodySchema = z.object({ layout: z.array(layoutItemSchema) });

function deviceToken(req: NextRequest) {
  return req.cookies.get("trice_device")?.value ?? null;
}

export async function GET(req: NextRequest) {
  const token = deviceToken(req);
  if (!token) return NextResponse.json({ layout: null });

  const row = await db.query.layoutPreferences.findFirst({
    where: eq(layoutPreferences.deviceToken, token),
  });
  return NextResponse.json({ layout: row?.layout ?? null });
}

export async function POST(req: NextRequest) {
  const token = deviceToken(req);
  if (!token) return NextResponse.json({ ok: false }, { status: 400 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  await db
    .insert(layoutPreferences)
    .values({ deviceToken: token, layout: parsed.data.layout })
    .onConflictDoUpdate({
      target: layoutPreferences.deviceToken,
      set: { layout: parsed.data.layout, updatedAt: new Date() },
    });

  return NextResponse.json({ ok: true });
}
