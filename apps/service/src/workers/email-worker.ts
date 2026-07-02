import { Worker } from "bullmq";
import { eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { Resend } from "resend";
import { connection, type EmailJob } from "@/queues/email-queue";
import { db, subscribers, days, emailSends, magicLinks } from "@/db";
import { confirmationEmail } from "@/email/templates/confirmation";
import { dailyDropEmail } from "@/email/templates/daily-drop";

// Resend is the default here for "works immediately with almost no infra."
// Given the stated preference for self-hosting, the swap-out is a single
// function: replace `resend.emails.send(...)` below with a call to your
// own SMTP relay (e.g. a self-hosted Postal instance) — nothing else in
// this worker, or in the templates, needs to change.
const resend = new Resend(process.env.RESEND_API_KEY);

new Worker<EmailJob>(
  "email",
  async (job) => {
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
      const day = (
        await db.select().from(days).where(eq(days.id, job.data.dayId!))
      )[0];
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
  },
  { connection },
).on("failed", async (job, err) => {
  if (!job) return;
  console.error(`email send failed for ${job.data.emailSendId}:`, err.message);
  await db
    .update(emailSends)
    .set({ status: "failed" })
    .where(eq(emailSends.id, job.data.emailSendId));
});
