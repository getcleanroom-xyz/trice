import { db } from "@/lib/db/client";
import { magicLinks, subscribers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// A link is good for repeated visits within the day (someone re-opening
// the email is normal), so we don't burn it on first use — only expiry
// matters. `usedAt` is recorded for analytics, not enforcement.
export async function validateMagicLink(token: string) {
  const link = await db.query.magicLinks.findFirst({ where: eq(magicLinks.token, token) });
  if (!link) return null;
  if (link.expiresAt.getTime() < Date.now()) return null;

  if (!link.usedAt) {
    await db.update(magicLinks).set({ usedAt: new Date() }).where(eq(magicLinks.id, link.id));
  }

  const subscriber = await db.query.subscribers.findFirst({
    where: eq(subscribers.id, link.subscriberId),
  });
  if (!subscriber) return null;

  return { subscriber, dayId: link.dayId };
}
