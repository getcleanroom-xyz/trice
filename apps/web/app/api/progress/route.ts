import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { learningProgress } from "@/lib/db/schema";

export async function GET(req: NextRequest) {
  const dayId = req.nextUrl.searchParams.get("dayId");
  const subscriberId = req.nextUrl.searchParams.get("subscriberId");
  if (!dayId || !subscriberId) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  const row = await db.query.learningProgress.findFirst({
    where: and(
      eq(learningProgress.dayId, dayId),
      eq(learningProgress.subscriberId, subscriberId),
    ),
  });

  return NextResponse.json({
    totalWatchSeconds: row?.totalWatchSeconds ?? 0,
    completedAt: row?.completedAt ?? null,
  });
}

export async function POST(req: NextRequest) {
  const { dayId, subscriberId, watchSeconds, targetSeconds } = await req.json();
  if (!dayId || !subscriberId) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  const now = new Date();
  const completed = watchSeconds >= targetSeconds;

  const existing = await db.query.learningProgress.findFirst({
    where: and(
      eq(learningProgress.dayId, dayId),
      eq(learningProgress.subscriberId, subscriberId),
    ),
  });

  if (existing) {
    await db
      .update(learningProgress)
      .set({
        totalWatchSeconds: Math.max(existing.totalWatchSeconds, watchSeconds),
        completedAt: completed && !existing.completedAt ? now : existing.completedAt,
        updatedAt: now,
      })
      .where(eq(learningProgress.id, existing.id));
  } else {
    await db.insert(learningProgress).values({
      dayId,
      subscriberId,
      totalWatchSeconds: watchSeconds,
      completedAt: completed ? now : null,
    });
  }

  return NextResponse.json({ completed });
}
