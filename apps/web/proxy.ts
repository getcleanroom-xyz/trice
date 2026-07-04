import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSessionCookie, ADMIN_COOKIE_NAME } from "@/lib/admin/session";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (pathname.startsWith("/admin/sign-in") || pathname.startsWith("/admin/verify")) {
      return NextResponse.next();
    }
    const cookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    if (!verifyAdminSessionCookie(cookie)) {
      return NextResponse.redirect(new URL("/admin/sign-in", req.url));
    }
  }

  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
