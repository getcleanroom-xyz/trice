"use server";

import { z } from "zod";
import https from "node:https";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db/client";
import { subscribers, days, magicLinks, emailSends } from "@/lib/db/schema";
import { and, eq, lte, gte, desc } from "drizzle-orm";

const schema = z.object({ email: z.string().trim().email() });

export type RequestLinkState = { ok: boolean; error?: string };

function sendEmail(body: Record<string, unknown>): Promise<void> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = https.request(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) resolve();
          else reject(new Error(`Resend ${res.statusCode}: ${data}`));
        });
      },
    );
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
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
  await db.insert(magicLinks).values({
    token,
    subscriberId: subscriber.id,
    dayId: today.id,
    expiresAt: today.expiresAt,
  });

  await db.insert(emailSends).values({
    subscriberId: subscriber.id,
    dayId: today.id,
    kind: "daily_drop",
    status: "queued",
  });

  const linkUrl = `${process.env.WEB_URL}/day/${today.slug}?token=${token}`;
  sendEmail({
    from: "Trice <hello@emails.getcleanroom.xyz>",
    to: parsed.data.email,
    subject: `Day ${today.title}`,
    html: `<div style="background:#16130E;color:#E8DFC8;font-family:'Work Sans',sans-serif;padding:36px 34px;"><div style="font-family:Georgia,serif;font-style:italic;font-size:18px;color:#ECE0C8;margin-bottom:32px;">Trice</div><p style="font-family:monospace;font-size:10px;letter-spacing:0.05em;color:#B98A46;margin:0 0 8px;">today's card</p><p style="font-family:Georgia,serif;font-size:22px;line-height:1.35;color:#F1E9D6;margin:0 0 18px;">${today.title}</p><p style="font-size:13px;line-height:1.7;color:#8C816A;margin:0 0 26px;">Ten minutes to watch, five to prove you did. This link works until midnight tonight — after that it's filed away.</p><a href="${linkUrl}" style="display:inline-block;border:1px solid #B98A46;color:#ECE0C8;font-family:monospace;font-size:12px;padding:11px 22px;border-radius:2px;text-decoration:none;">Open today's card &rarr;</a><div style="border-top:1px solid rgba(236,227,208,0.1);margin-top:32px;padding-top:18px;font-family:monospace;font-size:10px;color:#6E6552;">day ${today.slug}</div></div>`,
  }).catch(() => {});

  return { ok: true };
}
