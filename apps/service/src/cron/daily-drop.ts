import { Elysia } from "elysia";
import { cron } from "@elysiajs/cron";
import { eq, and, desc, isNull, gte, lte } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { db, days, subscribers, emailSends, insightTokens } from "@/db";
import { emailQueue } from "@/queues/email-queue";

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

export const dailyDropCron = new Elysia()
  .use(
    cron({
      name: "daily-drop",
      pattern: "0 7 * * 1-5",
      timezone: "Africa/Lagos",
      async run() {
        try {
          const now = new Date();
          const openDay = (
            await db
              .select({ id: days.id, expiresAt: days.expiresAt })
              .from(days)
              .where(and(lte(days.publishAt, now), gte(days.expiresAt, now)))
              .limit(1)
          )[0];
          if (!openDay) return;

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

          if (missing.length === 0) return;

          for (const s of missing) {
            const [emailSend] = await db.insert(emailSends).values({
              subscriberId: s.id,
              dayId: openDay.id,
              kind: "daily_drop",
              status: "queued",
            }).returning();

            await emailQueue.add(
              "send",
              {
                emailSendId: emailSend.id,
                kind: "daily_drop",
                subscriberId: s.id,
                dayId: openDay.id,
              },
              { jobId: emailSend.id, attempts: 5, backoff: { type: "exponential", delay: 5000 } },
            );
          }
        } catch (err) {
          console.error("daily-drop cron failed:", err);
        }
      },
    }),
  )
  .use(
    cron({
      name: "weekly-insights",
      pattern: "0 20 * * 0",
      timezone: "Africa/Lagos",
      async run() {
        try {
          const { start: weekStart } = getLastWeekBounds();

          const activeSubscribers = await db.select().from(subscribers).where(
            isNull(subscribers.unsubscribedAt),
          );
          if (activeSubscribers.length === 0) return;

          for (const s of activeSubscribers) {
            const existing = await db.select().from(insightTokens).where(
              and(
                eq(insightTokens.subscriberId, s.id),
                eq(insightTokens.weekStart, weekStart),
              ),
            );
            if (existing.length > 0) continue;

            const token = randomBytes(32).toString("base64url");
            const expiresAt = new Date(weekStart);
            expiresAt.setDate(expiresAt.getDate() + 14);

            const [insightToken] = await db.insert(insightTokens).values({
              subscriberId: s.id,
              weekStart,
              token,
              expiresAt,
            }).returning();

            const [emailSend] = await db.insert(emailSends).values({
              subscriberId: s.id,
              kind: "weekly_insights",
              status: "queued",
            }).returning();

            await emailQueue.add(
              "send",
              {
                emailSendId: emailSend.id,
                kind: "weekly_insights",
                subscriberId: s.id,
                insightTokenId: insightToken.id,
                weekStart: weekStart.toISOString().split("T")[0],
              },
              { jobId: emailSend.id, attempts: 5, backoff: { type: "exponential", delay: 5000 } },
            );
          }
        } catch (err) {
          console.error("weekly-insights cron failed:", err);
        }
      },
    }),
  )
