import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSessionCookie, ADMIN_COOKIE_NAME } from "@/lib/admin/session";

// Renamed from middleware.ts to proxy.ts in Next.js 16 to make the network
// boundary explicit. Handles two unrelated concerns on the way in:
//  1. gating /admin/* behind the signed session cookie
//  2. handing every visitor to /day/* a stable, anonymous device token —
//     this is what layout_preferences is keyed by, so the draggable daily
//     page layout survives across browsers on the same device without
//     ever being a login mechanism (see app/api/layout/route.ts).
const DEVICE_COOKIE = "trice_device";

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
    return NextResponse.next();
  }

  if (pathname.startsWith("/day/") && !req.cookies.get(DEVICE_COOKIE)) {
    const response = NextResponse.next();
    response.cookies.set(DEVICE_COOKIE, crypto.randomUUID(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      // ~2 years — this is a "same device" preference, not a session.
      maxAge: 60 * 60 * 24 * 730,
      path: "/",
    });
    return response;
  }

  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/day/:path*"] };
