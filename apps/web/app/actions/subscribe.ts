"use server";

import { z } from "zod";
import https from "node:https";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { subscribers, emailSends } from "@/lib/db/schema";

const schema = z.object({ email: z.string().trim().email() });

export type SubscribeState = { ok: boolean; alreadySubscribed?: boolean; error?: string };

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

export async function subscribe(
  _prev: SubscribeState,
  formData: FormData,
): Promise<SubscribeState> {
  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { ok: false, error: "That doesn't look like a valid email." };
  }

  const existing = await db.query.subscribers.findFirst({
    where: eq(subscribers.email, parsed.data.email),
  });
  if (existing) {
    return { ok: true, alreadySubscribed: true };
  }

  const [subscriber] = await db
    .insert(subscribers)
    .values({ email: parsed.data.email })
    .returning();

  await db.insert(emailSends).values({
    subscriberId: subscriber.id,
    kind: "confirmation",
    status: "queued",
  });

  sendEmail({
    from: "Trice <hello@emails.getcleanroom.xyz>",
    to: parsed.data.email,
    subject: "You're on the roll",
    html: `<div style="background:#16130E;color:#E8DFC8;font-family:'Work Sans',sans-serif;padding:36px 34px;"><div style="font-family:Georgia,serif;font-style:italic;font-size:18px;color:#ECE0C8;margin-bottom:32px;">Trice</div><p style="font-family:Georgia,serif;font-size:21px;line-height:1.4;color:#F1E9D6;margin:0 0 18px;">You're on the roll.</p><p style="font-size:14px;line-height:1.75;color:#B4A98D;margin:0 0 20px;">One email a day, one idea, fifteen minutes. Nothing to install, nothing to remember — just a link that shows up each morning and works for that day only.</p><div style="border:1px solid rgba(236,227,208,0.14);border-radius:3px;padding:16px 18px;margin-bottom:24px;"><div style="font-family:monospace;font-size:10px;letter-spacing:0.05em;color:#B98A46;margin-bottom:6px;">first card arrives</div><div style="font-family:Georgia,serif;font-size:16px;color:#F1E9D6;">Tomorrow morning</div></div><p style="font-size:13px;line-height:1.7;color:#8C816A;margin:0 0 28px;">Miss a day and that day's card is filed away for good — but the next one still comes right on schedule. No catching up, no guilt, just tomorrow.</p><div style="border-top:1px solid rgba(236,227,208,0.1);padding-top:18px;font-family:monospace;font-size:10px;color:#6E6552;">sent because you signed up at trice.getcleanroom.xyz</div></div>`,
  }).catch(() => {});

  return { ok: true, alreadySubscribed: false };
}
