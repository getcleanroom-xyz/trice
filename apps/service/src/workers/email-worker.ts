import { Worker } from "bullmq";
import { Elysia } from "elysia";
import { cron } from "@elysiajs/cron";
import { eq, and, isNull, gte, lte } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { Resend } from "resend";
import { connection, type EmailJob } from "@/queues/email-queue";
import { db, subscribers, days, emailSends, magicLinks } from "@/db";
import { confirmationEmail } from "@/email/templates/confirmation";
import { dailyDropEmail } from "@/email/templates/daily-drop";

console.log("worker starting — env check:", {
  DATABASE_URL: process.env.DATABASE_URL ? "set" : "MISSING",
  REDIS_URL: process.env.REDIS_URL ? "set" : "MISSING",
  RESEND_API_KEY: process.env.RESEND_API_KEY ? "set" : "MISSING",
  WEB_URL: process.env.WEB_URL ? "set" : "MISSING",
});

const resend = new Resend(process.env.RESEND_API_KEY);

try {
  new Worker<EmailJob>("email", async (job) => {
    const subscriber = (
      await db.select().from(subscribers).where(eq(subscribers.id, job.data.subscriberId))
    )[0];
    if (!subscriber || subscriber.unsubscribedAt) return;

    if (job.data.kind === "confirmation") {
      const { error } = await resend.emails.send({
        from: "Trice <hello@emails.getcleanroom.xyz>",
        to: subscriber.email,
        subject: "You're on the roll",
        html: confirmationEmail(),
      });
      if (error) throw new Error(error.message);
    } else {
      const day = (await db.select().from(days).where(eq(days.id, job.data.dayId!)))[0];
      if (!day) return;

      const token = randomBytes(32).toString("base64url");
      await db.insert(magicLinks).values({
        token,
        subscriberId: subscriber.id,
        dayId: day.id,
        expiresAt: day.expiresAt,
      });

      const { error } = await resend.emails.send({
        from: "Trice <hello@emails.getcleanroom.xyz>",
        to: subscriber.email,
        subject: `Day ${day.title}`,
        html: dailyDropEmail({
          title: day.title,
          slug: day.slug,
          url: `${process.env.WEB_URL}/day/${day.slug}?token=${token}`,
        }),
      });
      if (error) throw new Error(error.message);
    }

    await db.update(emailSends).set({ status: "sent", sentAt: new Date() }).where(
      eq(emailSends.id, job.data.emailSendId),
    );
  }, { connection }).on("failed", async (job, err) => {
    if (!job) return;
    console.error("email send failed for", job.data.emailSendId, ":", err.message);
    await db.update(emailSends).set({ status: "failed" }).where(
      eq(emailSends.id, job.data.emailSendId),
    );
  });
  console.log("bullmq email worker connected");
} catch (err) {
  console.error("bullmq worker init failed:", err);
}

const app = new Elysia()
  .use(cron({
    name: "daily-drop",
    pattern: "0 7 * * 1-5",
    timezone: "Africa/Lagos",
    async run() {
      try {
        const now = new Date();
        const openDay = (
          await db.select().from(days).where(
            and(lte(days.publishAt, now), gte(days.expiresAt, now))
          ).limit(1)
        )[0];
        if (!openDay) return;

        const activeSubscribers = await db.select().from(subscribers).where(
          isNull(subscribers.unsubscribedAt),
        );
        if (activeSubscribers.length === 0) return;

        for (const s of activeSubscribers) {
          await db.insert(emailSends).values({
            subscriberId: s.id,
            dayId: openDay.id,
            kind: "daily_drop",
            status: "queued",
          });
        }
      } catch (err) {
        console.error("daily-drop cron failed:", err);
      }
    },
  }))
  .use(cron({
    name: "poll-queued-emails",
    pattern: "*/30 * * * * *",
    async run() {
      try {
        const queued = await db.select().from(emailSends).where(
          eq(emailSends.status, "queued"),
        ).limit(500);

        const { emailQueue } = await import("@/queues/email-queue");
        for (const row of queued) {
          await emailQueue.add("send", {
            emailSendId: row.id,
            kind: row.kind as "confirmation" | "daily_drop",
            subscriberId: row.subscriberId,
            dayId: row.dayId ?? undefined,
          }, { jobId: row.id, attempts: 5, backoff: { type: "exponential", delay: 5000 } });
        }
      } catch (err) {
        console.error("poll-queued-emails cron failed:", err);
      }
    },
  }));

console.log("trice worker started (email worker + cron scheduler)");
