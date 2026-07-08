import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { subscribers } from "@/lib/db/schema";
import { verifyUnsubscribeSig } from "@/lib/auth/unsubscribe";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ subscriberId: string }> },
) {
  const { subscriberId } = await params;
  const sig = _req.nextUrl.searchParams.get("sig");
  if (!sig || !verifyUnsubscribeSig(subscriberId, sig)) {
    return new NextResponse("Invalid or missing signature", { status: 400 });
  }

  await db.update(subscribers).set({ unsubscribedAt: new Date() }).where(
    eq(subscribers.id, subscriberId),
  );

  return new NextResponse(
    `<html><body style="background:#16130E;color:#E8DFC8;display:flex;align-items:center;justify-content:center;height:100vh;font-family:Georgia,serif;font-size:20px;">
      You've been unsubscribed. No more emails.
    </body></html>`,
    { headers: { "content-type": "text/html;charset=utf-8" } },
  );
}
