import { eq, and, isNull, lte, gte } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { db, days, subscribers, emailSends, insightTokens } from "@/db";
import { emailQueue } from "./queue";

function getLastWeekBounds(): { start: Date; end: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() - daysSinceMonday);
  thisMonday.setHours(0, 0, 0, 0);
  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(thisMonday.getDate() - 7);
  const lastSunday = new Date(lastMonday);
  lastSunday.setDate(lastMonday.getDate() + 7);
  return { start: lastMonday, end: lastSunday };
}

export async function dailyDropRun() {
  try {
    const now = new Date();
    const openDays = await db
      .select({ id: days.id, expiresAt: days.expiresAt })
      .from(days)
      .where(and(lte(days.publishAt, now), gte(days.expiresAt, now)));

    if (openDays.length === 0) {
      console.log("[cron] daily-drop: no open day found");
      return;
    }

    console.log("[cron] daily-drop: found", openDays.length, "open day(s)");

    for (const openDay of openDays) {
      const missing = await db
        .select({ id: subscribers.id })
        .from(subscribers)
        .leftJoin(
          emailSends,
          and(
            eq(emailSends.subscriberId, subscribers.id),
            eq(emailSends.dayId, openDay.id),
          ),
        )
        .where(and(isNull(subscribers.unsubscribedAt), isNull(emailSends.id)));

      if (missing.length === 0) {
        console.log("[cron] daily-drop: day", openDay.id, "already sent to all subscribers");
        continue;
      }

      console.log("[cron] daily-drop: found", missing.length, "subscriber(s) to notify for day", openDay.id);

      const inserted = await db.insert(emailSends).values(
        missing.map((s) => ({
          subscriberId: s.id,
          dayId: openDay.id,
          kind: "daily_drop" as const,
          status: "queued" as const,
        })),
      ).returning();

      await emailQueue.addBulk(
        inserted.map((es) => ({
          name: "send",
          data: {
            emailSendId: es.id,
            kind: "daily_drop",
            subscriberId: es.subscriberId,
            dayId: openDay.id,
          },
          opts: { jobId: es.id, attempts: 5, backoff: { type: "exponential", delay: 5000 } },
        })),
      );
    }
  } catch (err) {
    console.error("[cron] daily-drop failed:", err);
  }
}

export async function weeklyInsightsRun() {
  try {
    const { start: weekStart } = getLastWeekBounds();

    const activeSubscribers = await db.select({ id: subscribers.id }).from(subscribers).where(
      isNull(subscribers.unsubscribedAt),
    );
    if (activeSubscribers.length === 0) return;

    const existing = await db.select({ subscriberId: insightTokens.subscriberId })
      .from(insightTokens)
      .where(eq(insightTokens.weekStart, weekStart));
    const existingSet = new Set(existing.map((r) => r.subscriberId));

    const newSubs = activeSubscribers.filter((s) => !existingSet.has(s.id));
    if (newSubs.length === 0) {
      console.log("[cron] weekly-insights: all subscribers already have tokens for week", weekStart);
      return;
    }

    const tokenExpiresAt = new Date(weekStart);
    tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 14);

    const tokenRows = newSubs.map((s) => ({
      subscriberId: s.id,
      weekStart,
      token: randomBytes(32).toString("base64url"),
      expiresAt: tokenExpiresAt,
    }));

    const insertedTokens = await db.insert(insightTokens).values(tokenRows).returning();

    const insertedSends = await db.insert(emailSends).values(
      insertedTokens.map((t) => ({
        subscriberId: t.subscriberId,
        kind: "weekly_insights" as const,
        status: "queued" as const,
      })),
    ).returning();

    const tokenBySubId = new Map(insertedTokens.map((t) => [t.subscriberId, t]));

    await emailQueue.addBulk(
      insertedSends.map((es) => {
        const token = tokenBySubId.get(es.subscriberId)!;
        return {
          name: "send",
          data: {
            emailSendId: es.id,
            kind: "weekly_insights",
            subscriberId: es.subscriberId,
            insightTokenId: token.id,
            weekStart: weekStart.toISOString().split("T")[0],
          },
          opts: { jobId: es.id, attempts: 5, backoff: { type: "exponential", delay: 5000 } },
        };
      }),
    );
  } catch (err) {
    console.error("weekly-insights cron failed:", err);
  }
}
