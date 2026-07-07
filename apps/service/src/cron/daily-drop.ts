import { Elysia } from "elysia";
import { cron } from "@elysiajs/cron";
import { eq, and, desc, isNull, gte, lte } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { db, days, subscribers, emailSends, insightTokens } from "@/db";
import { emailQueue } from "@/queues/email-queue";

// Four crons:
//
//  1. on-time-delivery — every 60s. For each live day, finds subscribers
//     without an email_sends row and batch-inserts them. Idempotent.
//
//  2. daily-drop — 7am WAT weekdays. Safety net with same logic.
//
//  3. weekly-insights — 8pm WAT Sundays. Creates insight tokens and queues
//     weekly summary emails for active subscribers.
//
//  4. poll-queued-emails — every 30s. Turns queued email_sends into BullMQ
//     jobs so the worker can send them.
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
      name: "on-time-delivery",
      pattern: "* * * * *",
      async run() {
        try {
          const now = new Date();
          const liveDays = await db
            .select({ id: days.id })
            .from(days)
            .where(and(lte(days.publishAt, now), gte(days.expiresAt, now)));

          if (liveDays.length === 0) return;

          for (const day of liveDays) {
            const missing = await db
              .select({ id: subscribers.id })
              .from(subscribers)
              .leftJoin(
                emailSends,
                and(
                  eq(emailSends.subscriberId, subscribers.id),
                  eq(emailSends.dayId, day.id),
                ),
              )
              .where(and(isNull(subscribers.unsubscribedAt), isNull(emailSends.id)));

            if (missing.length === 0) continue;

            await db.insert(emailSends).values(
              missing.map((s) => ({
                subscriberId: s.id,
                dayId: day.id,
                kind: "daily_drop" as const,
                status: "queued" as const,
              })),
            );
          }
        } catch (err) {
          console.error("on-time-delivery cron failed:", err);
        }
      },
    }),
  )
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
              .select({ id: days.id })
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

          await db.insert(emailSends).values(
            missing.map((s) => ({
              subscriberId: s.id,
              dayId: openDay.id,
              kind: "daily_drop" as const,
              status: "queued" as const,
            })),
          );
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
  .use(
    cron({
      name: "poll-queued-emails",
      pattern: "*/30 * * * * *",
      async run() {
        try {
          const queued = await db
            .select()
            .from(emailSends)
            .where(eq(emailSends.status, "queued"))
            .limit(500);

          for (const row of queued) {
            const base = {
              emailSendId: row.id,
              subscriberId: row.subscriberId,
              dayId: row.dayId ?? undefined,
            };

            if (row.kind === "weekly_insights") {
              const tokens = await db
                .select()
                .from(insightTokens)
                .where(eq(insightTokens.subscriberId, row.subscriberId))
                .orderBy(desc(insightTokens.weekStart))
                .limit(1);
              const insightToken = tokens[0];
              if (!insightToken) continue;

              await emailQueue.add(
                "send",
                {
                  ...base,
                  kind: "weekly_insights",
                  insightTokenId: insightToken.id,
                  weekStart: insightToken.weekStart.toISOString().split("T")[0],
                },
                { jobId: row.id, attempts: 5, backoff: { type: "exponential", delay: 5000 } },
              );
            } else {
              await emailQueue.add(
                "send",
                {
                  ...base,
                  kind: row.kind as "confirmation" | "daily_drop" | "grading_notification",
                },
                { jobId: row.id, attempts: 5, backoff: { type: "exponential", delay: 5000 } },
              );
            }
          }
        } catch (err) {
          console.error("poll-queued-emails cron failed:", err);
        }
      },
    }),
  )

