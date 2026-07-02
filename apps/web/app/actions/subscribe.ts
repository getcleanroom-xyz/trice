"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { subscribers, emailSends } from "@/lib/db/schema";

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

  return { ok: true, alreadySubscribed: false };
}
