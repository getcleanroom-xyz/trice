import { createHash, timingSafeEqual } from "node:crypto";

const SECRET = process.env.ADMIN_SESSION_SECRET ?? "";

export function createUnsubscribeUrl(subscriberId: string): string {
  const sig = createHash("sha256").update(`${subscriberId}:${SECRET}`).digest("hex");
  return `${process.env.WEB_URL}/api/unsubscribe/${subscriberId}?sig=${sig}`;
}

export function verifyUnsubscribeSig(subscriberId: string, sig: string): boolean {
  const expected = createHash("sha256").update(`${subscriberId}:${SECRET}`).digest("hex");
  if (sig.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}
