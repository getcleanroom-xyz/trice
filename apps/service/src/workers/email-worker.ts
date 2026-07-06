import { Worker } from "bullmq";
import { Elysia } from "elysia";
import { cron } from "@elysiajs/cron";
import { eq, and, isNull, gte, lte } from "drizzle-orm";

import { randomBytes } from "node:crypto";
import { Resend } from "resend";
import { connection, type EmailJob } from "@/queues/email-queue";
import { db, subscribers, days, emailSends, magicLinks, insightTokens, quizAttempts, learningProgress } from "@/db";
import { confirmationEmail } from "@/email/templates/confirmation";
import { dailyDropEmail } from "@/email/templates/daily-drop";
import { weeklyInsightsEmail } from "@/email/templates/weekly-insights";
import { gradingNotificationEmail } from "@/email/templates/grading-notification";



const resend = new Resend(process.env.RESEND_API_KEY);

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
    } else if (job.data.kind === "daily_drop") {
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
    } else if (job.data.kind === "grading_notification") {
      if (!job.data.dayId) return;
      const attempt = (
        await db.select().from(quizAttempts).where(
          and(
            eq(quizAttempts.subscriberId, subscriber.id),
            eq(quizAttempts.dayId, job.data.dayId),
          ),
        )
      )[0];
      if (!attempt || !attempt.taskGrade) return;

      const day = (await db.select().from(days).where(eq(days.id, attempt.dayId)))[0];
      if (!day) return;

      const { error } = await resend.emails.send({
        from: "Trice <hello@emails.getcleanroom.xyz>",
        to: subscriber.email,
        subject: `Your task for day ${day.dayNumber} has been graded`,
        html: gradingNotificationEmail({
          dayTitle: day.title,
          dayNumber: day.dayNumber,
          grade: attempt.taskGrade,
        }),
      });
      if (error) throw new Error(error.message);
    } else if (job.data.kind === "weekly_insights") {
      const weekStart = new Date(job.data.weekStart!);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const weekDays = await db.select().from(days).where(
        and(gte(days.publishAt, weekStart), lte(days.publishAt, weekEnd)),
      );

      const dayIds = weekDays.map((d) => d.id);

      let totalCorrect = 0;
      let totalQuestions = 0;

      if (dayIds.length > 0) {
        const attempts = await db.select().from(quizAttempts).where(
          eq(quizAttempts.subscriberId, subscriber.id),
        );
        for (const a of attempts) {
          if (dayIds.includes(a.dayId)) {
            totalCorrect += a.score;
          }
        }

        const allQuestions = await db.select().from(quizAttempts).where(
          eq(quizAttempts.subscriberId, subscriber.id),
        );
        totalQuestions = dayIds.length * 3;
      }

      const { start: weekLabelStart } = { start: new Date(weekStart) };
      const weekLabelEnd = new Date(weekStart);
      weekLabelEnd.setDate(weekLabelEnd.getDate() + 6);
      const fmt = (d: Date) => d.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
      const weekLabel = `${fmt(weekLabelStart)} – ${fmt(weekLabelEnd)}`;

      const insightToken = job.data.insightTokenId
        ? (await db.select().from(insightTokens).where(eq(insightTokens.id, job.data.insightTokenId)))[0]
        : null;

      if (!insightToken) return;

      const { error } = await resend.emails.send({
        from: "Trice <hello@emails.getcleanroom.xyz>",
        to: subscriber.email,
        subject: "Your week in learning",
        html: weeklyInsightsEmail({
          weekLabel,
          daysAvailable: weekDays.length,
          daysShownUp: weekDays.length,
          totalCorrect,
          totalQuestions,
          url: `${process.env.WEB_URL}/insights/${weekStart.toISOString().split("T")[0]}?token=${insightToken.token}`,
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

          await db.insert(emailSends).values({
            subscriberId: s.id,
            kind: "weekly_insights",
            status: "queued",
          });

          const { emailQueue } = await import("@/queues/email-queue");
          const queued = await db.select().from(emailSends).where(
            and(
              eq(emailSends.subscriberId, s.id),
              eq(emailSends.kind, "weekly_insights"),
              eq(emailSends.status, "queued"),
            ),
          );
          const latest = queued[queued.length - 1];
          if (latest) {
            await emailQueue.add("send", {
              emailSendId: latest.id,
              kind: "weekly_insights",
              subscriberId: s.id,
              insightTokenId: insightToken.id,
              weekStart: weekStart.toISOString().split("T")[0],
            }, { jobId: latest.id, attempts: 5, backoff: { type: "exponential", delay: 5000 } });
          }
        }
      } catch (err) {
        console.error("weekly-insights cron failed:", err);
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
            kind: row.kind as "confirmation" | "daily_drop" | "weekly_insights" | "grading_notification",
            subscriberId: row.subscriberId,
            dayId: row.dayId ?? undefined,
          }, { jobId: row.id, attempts: 5, backoff: { type: "exponential", delay: 5000 } });
        }
      } catch (err) {
        console.error("poll-queued-emails cron failed:", err);
      }
    },
  }));

