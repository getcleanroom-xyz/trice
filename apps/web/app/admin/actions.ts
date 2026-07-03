"use server";

import { z } from "zod";
import https from "node:https";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db/client";
import { adminLoginTokens } from "@/lib/db/schema";

const schema = z.object({ email: z.string().trim().email() });

export type AdminAuthState = { ok: boolean; error?: string };

function sendViaResend(body: Record<string, unknown>): Promise<void> {
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
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve();
          } else {
            reject(new Error(`Resend returned ${res.statusCode}: ${data}`));
          }
        });
      },
    );
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

export async function requestAdminLink(
  _prev: AdminAuthState,
  formData: FormData,
): Promise<AdminAuthState> {
  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { ok: false, error: "That doesn't look like a valid email." };

  if (parsed.data.email.toLowerCase() !== process.env.ADMIN_EMAIL?.toLowerCase()) {
    return { ok: true };
  }

  const token = randomBytes(32).toString("base64url");
  await db.insert(adminLoginTokens).values({
    token,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
  });

  try {
    await sendViaResend({
      from: "Trice <hello@emails.getcleanroom.xyz>",
      to: parsed.data.email,
      subject: "Your admin link",
      html: `<div style="background:#16130E;color:#E8DFC8;font-family:sans-serif;padding:32px;">
      <p style="font-family:Georgia,serif;font-style:italic;font-size:18px;margin-bottom:24px;">Trice</p>
      <p style="margin-bottom:20px;">One link, good for fifteen minutes.</p>
      <a href="${process.env.WEB_URL}/admin/verify?token=${token}" style="display:inline-block;border:1px solid #B98A46;color:#ECE0C8;font-family:monospace;font-size:12px;padding:10px 20px;border-radius:2px;text-decoration:none;">Enter the admin</a>
    </div>`,
    });
  } catch {
    return { ok: false, error: "Couldn't send the email — try again in a moment." };
  }

  return { ok: true };
}
