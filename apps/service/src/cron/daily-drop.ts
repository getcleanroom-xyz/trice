import { Elysia } from "elysia";
import { cron } from "@elysiajs/cron";
import { eq, and, isNull, gte, lte } from "drizzle-orm";
import { db, days, subscribers, emailSends } from "@/db";

// Two crons, each with a clear responsibility:
//
//  1. on-time-delivery — runs every 60 seconds. For each "live" day
//     (publishAt <= now <= expiresAt), finds active subscribers who don't
//     yet have an email_sends row and batch-inserts them. This is fully
//     idempotent: re-running never creates duplicates, so it catches any
//     window the previous run missed (crash, cold start, subscriber joined
//     after initial send).
//
//  2. daily-drop — safety net at 7am WAT weekdays. Uses the same logic as
//     on-time-delivery but as a backup in case the frequent cron was down.
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

