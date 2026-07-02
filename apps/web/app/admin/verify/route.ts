import { NextRequest, NextResponse } from "next/server";
import { eq, and, gt, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { adminLoginTokens } from "@/lib/db/schema";
import { createAdminSessionCookie, ADMIN_COOKIE_NAME } from "@/lib/admin/session";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.redirect(new URL("/admin/sign-in", req.url));

  const row = await db.query.adminLoginTokens.findFirst({
    where: and(
      eq(adminLoginTokens.token, token),
      isNull(adminLoginTokens.usedAt),
      gt(adminLoginTokens.expiresAt, new Date()),
    ),
  });
  if (!row) return NextResponse.redirect(new URL("/admin/sign-in?expired=1", req.url));

  await db
    .update(adminLoginTokens)
    .set({ usedAt: new Date() })
    .where(eq(adminLoginTokens.id, row.id));

  const response = NextResponse.redirect(new URL("/admin", req.url));
  response.cookies.set(ADMIN_COOKIE_NAME, createAdminSessionCookie(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 12,
    path: "/",
  });
  return response;
}
