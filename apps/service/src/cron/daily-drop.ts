import { Elysia } from "elysia";
import { cron } from "@elysiajs/cron";
import { eq, and, isNull, gte, lte } from "drizzle-orm";
import { db, days, subscribers, emailSends } from "@/db";
import { emailQueue } from "@/queues/email-queue";

// Two crons, deliberately separate:
//  - dailyDrop fires once at 7am WAT and fans a `daily_drop` email_sends
//    row out to every active subscriber for whichever day just opened.
//  - pollQueuedEmails runs every 30s and turns any `queued` email_sends
//    row — from either cron below, from the web app's signup action, or
//    from a hand-retried failure — into an actual BullMQ job. Using the
//    row's own id as the BullMQ jobId makes re-polling idempotent: adding
//    the same jobId twice is a no-op, so there's no dedupe logic to get
//    wrong here.
export const dailyDropCron = new Elysia()
  .use(
    cron({
      name: "daily-drop",
      pattern: "0 7 * * 1-5", // 07:00 WAT, weekdays — adjust for your audience
      timezone: "Africa/Lagos",
      async run() {
        const now = new Date();
        const openDay = (
          await db
            .select()
            .from(days)
            .where(and(lte(days.publishAt, now), gte(days.expiresAt, now)))
            .limit(1)
        )[0];
        if (!openDay) return;

        const activeSubscribers = await db
          .select()
          .from(subscribers)
          .where(isNull(subscribers.unsubscribedAt));

        if (activeSubscribers.length === 0) return;

        // TODO at meaningful scale: batch this insert (drizzle supports
        // multi-row `.values([...])`) instead of one row at a time, and
        // move the fan-out itself into a BullMQ "flow" so a crash mid-run
        // is resumable instead of restarting from zero.
        for (const subscriber of activeSubscribers) {
          await db.insert(emailSends).values({
            subscriberId: subscriber.id,
            dayId: openDay.id,
            kind: "daily_drop",
            status: "queued",
          });
        }
      },
    }),
  )
  .use(
    cron({
      name: "poll-queued-emails",
      pattern: "*/30 * * * * *",
      async run() {
        const queued = await db
          .select()
          .from(emailSends)
          .where(eq(emailSends.status, "queued"))
          .limit(500);

        for (const row of queued) {
          await emailQueue.add(
            "send",
            {
              emailSendId: row.id,
              kind: row.kind as "confirmation" | "daily_drop",
              subscriberId: row.subscriberId,
              dayId: row.dayId ?? undefined,
            },
            { jobId: row.id, attempts: 5, backoff: { type: "exponential", delay: 5000 } },
          );
        }
      },
    }),
  );
