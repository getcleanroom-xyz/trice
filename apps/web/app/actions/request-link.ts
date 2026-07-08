"use server";

import { z } from "zod";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db/client";
import { subscribers, days, magicLinks, emailSends } from "@/lib/db/schema";
import { and, eq, lte, gte, desc } from "drizzle-orm";
import { getResend, dailyDropHtml } from "@/lib/email";

const schema = z.object({ email: z.string().trim().email() });

export type RequestLinkState = { ok: boolean; error?: string };

export async function requestLink(
  _prev: RequestLinkState,
  formData: FormData,
): Promise<RequestLinkState> {
  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { ok: false, error: "That doesn't look like a valid email." };
  }

  const subscriber = await db.query.subscribers.findFirst({
    where: eq(subscribers.email, parsed.data.email),
  });
  if (!subscriber) return { ok: true };

  const now = new Date();
  const today = await db.query.days.findFirst({
    where: and(lte(days.publishAt, now), gte(days.expiresAt, now)),
    orderBy: desc(days.publishAt),
  });
  if (!today) return { ok: true };

  const token = randomBytes(32).toString("base64url");
  const url = `${process.env.WEB_URL}/day/${today.slug}?token=${token}`;

  await db.insert(magicLinks).values({
    token,
    subscriberId: subscriber.id,
    dayId: today.id,
    expiresAt: today.expiresAt,
  });

  const { error } = await getResend().emails.send({
    from: "Trice <hello@emails.getcleanroom.xyz>",
    to: subscriber.email,
    subject: `Day ${today.title}`,
    html: dailyDropHtml({ title: today.title, url }),
  });

  await db.insert(emailSends).values({
    subscriberId: subscriber.id,
    dayId: today.id,
    kind: "daily_drop",
    status: error ? "failed" : "sent",
  });

  return { ok: true };
}
