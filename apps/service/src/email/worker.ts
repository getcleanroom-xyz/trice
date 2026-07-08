import { Worker } from "bullmq";
import { eq, and, gte, lte } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { Resend } from "resend";
import { connection, type EmailJob } from "./queue";
import { db, subscribers, days, emailSends, magicLinks, insightTokens, quizAttempts } from "@/db";
import { confirmationEmail } from "@/email/templates/confirmation";
import { dailyDropEmail } from "@/email/templates/daily-drop";
import { weeklyInsightsEmail } from "@/email/templates/weekly-insights";
import { gradingNotificationEmail } from "@/email/templates/grading-notification";

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
    } else if (job.data.kind === "daily_drop") {
      const day = (await db.select().from(days).where(eq(days.id, job.data.dayId!)))[0];
      if (!day || day.expiresAt < new Date()) return;

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
