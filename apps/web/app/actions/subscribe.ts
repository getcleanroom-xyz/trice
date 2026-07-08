"use server";

import { z } from "zod";
import { db } from "@/lib/db/client";
import { subscribers, emailSends } from "@/lib/db/schema";
import { getResend, confirmationHtml } from "@/lib/email";

const schema = z.object({ email: z.string().trim().email() });

export type SubscribeState = { ok: boolean; alreadySubscribed?: boolean; error?: string };

export async function subscribe(
  _prev: SubscribeState,
  formData: FormData,
): Promise<SubscribeState> {
  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { ok: false, error: "That doesn't look like a valid email." };
  }

  const [subscriber] = await db
    .insert(subscribers)
    .values({ email: parsed.data.email })
    .onConflictDoNothing()
    .returning();

  if (!subscriber) {
    return { ok: true, alreadySubscribed: true };
  }

  const { error } = await getResend().emails.send({
    from: "Trice <hello@emails.getcleanroom.xyz>",
    to: subscriber.email,
    subject: "You're on the roll",
    html: confirmationHtml(),
  });

  await db.insert(emailSends).values({
    subscriberId: subscriber.id,
    kind: "confirmation",
    status: error ? "failed" : "sent",
  });

  return { ok: true, alreadySubscribed: false };
}
