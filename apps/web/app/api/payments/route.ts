import { NextRequest, NextResponse } from "next/server";

const SERVICE_URL = process.env.SERVICE_URL;

export async function POST(req: NextRequest) {
  if (!SERVICE_URL) {
    return NextResponse.json({ error: "Service not configured" }, { status: 500 });
  }

  const body = await req.json();
  const { method } = body as { method: "fiat" | "crypto" };
  const endpoint =
    method === "fiat"
      ? `${SERVICE_URL}/payments/flutterwave/link`
      : `${SERVICE_URL}/payments/nowpayments/link`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountNgnKobo: body.amountNgnKobo }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Payment service unavailable" }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Payment service unreachable" }, { status: 502 });
  }
}
