"use server";

import { z } from "zod";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db/client";
import { subscribers, days, magicLinks, emailSends } from "@/lib/db/schema";
import { and, eq, lte, gte, desc } from "drizzle-orm";
import { Resend } from "resend";

const schema = z.object({ email: z.string().trim().email() });

const resend = new Resend(process.env.RESEND_API_KEY!);

export type RequestLinkState = { ok: boolean; error?: string };

function dailyDropHtml({ title, url }: { title: string; url: string }) {
  return `<div style="background:#16130E;color:#E8DFC8;font-family:'Work Sans',sans-serif;padding:36px 34px;">
    <div style="font-family:Georgia,serif;font-style:italic;font-size:18px;color:#ECE0C8;margin-bottom:32px;">Trice</div>
    <p style="font-family:monospace;font-size:10px;letter-spacing:0.05em;color:#B98A46;margin:0 0 8px;">today's card</p>
    <p style="font-family:Georgia,serif;font-size:22px;line-height:1.35;color:#F1E9D6;margin:0 0 18px;">${title}</p>
    <p style="font-size:13px;line-height:1.7;color:#8C816A;margin:0 0 26px;">
      Ten minutes to watch, five to prove you did. This link works until midnight
      tonight &mdash; after that it's filed away.
    </p>
    <a href="${url}" style="display:inline-block;border:1px solid #B98A46;color:#ECE0C8;font-family:monospace;font-size:12px;padding:11px 22px;border-radius:2px;text-decoration:none;">
      Open today's card &rarr;
    </a>
  </div>`;
}

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

  const { error } = await resend.emails.send({
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