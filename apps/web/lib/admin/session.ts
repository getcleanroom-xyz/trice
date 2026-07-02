import { createHmac, timingSafeEqual } from "node:crypto";

const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const COOKIE_NAME = "trice_admin";

function sign(payload: string): string {
  return createHmac("sha256", process.env.ADMIN_SESSION_SECRET!).update(payload).digest("hex");
}

// Stateless on purpose: the admin area has exactly one user, so there's no
// session list to revoke or look up — a signed, expiring cookie is simpler
// and needs no DB round trip on every /admin request (checked in proxy.ts).
export function createAdminSessionCookie(): string {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminSessionCookie(value: string | undefined): boolean {
  if (!value) return false;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return false;

  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  return Number(payload) > Date.now();
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
