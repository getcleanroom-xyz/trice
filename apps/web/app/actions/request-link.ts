"use server";

import { z } from "zod";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db/client";
import { subscribers, days, magicLinks, emailSends } from "@/lib/db/schema";
import { and, eq, lte, gte, desc } from "drizzle-orm";

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
  // Don't reveal whether the email is subscribed — same response either way.
  if (!subscriber) return { ok: true };

  const now = new Date();
  const today = await db.query.days.findFirst({
    where: and(lte(days.publishAt, now), gte(days.expiresAt, now)),
    orderBy: desc(days.publishAt),
  });
  if (!today) return { ok: true }; // nothing open right now — nothing to send

  await db.insert(magicLinks).values({
    token: randomBytes(32).toString("base64url"),
    subscriberId: subscriber.id,
    dayId: today.id,
    // A requested link is deliberately shorter-lived than the morning one:
    // it should get you into today's card, not extend the day's window.
    expiresAt: today.expiresAt,
  });

  await db.insert(emailSends).values({
    subscriberId: subscriber.id,
    dayId: today.id,
    kind: "daily_drop",
    status: "queued",
  });

  return { ok: true };
}
