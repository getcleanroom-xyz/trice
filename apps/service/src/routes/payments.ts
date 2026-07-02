import { Elysia, t } from "elysia";
import { createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, payments } from "@/db";
import { ngnToUsd } from "@/fx";

// Neither provider requires Trice to hold funds itself:
//  - Flutterwave's Standard Payments API returns a hosted checkout link for
//    card / bank transfer / USSD in NGN — funds settle to a Flutterwave
//    merchant balance, not a wallet this app manages.
//  - NOWPayments is non-custodial: its Invoice API returns a hosted payment
//    page covering 350+ coins, and pays out to a wallet address configured
//    in the NOWPayments dashboard, not one this code ever touches. This is
//    the "generate a payment link instead of adding a wallet" fit.
export const paymentsRoutes = new Elysia({ prefix: "/payments" })
  .post(
    "/flutterwave/link",
    async ({ body }) => {
      const txRef = `trice-${crypto.randomUUID()}`;

      const res = await fetch("https://api.flutterwave.com/v3/payments", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tx_ref: txRef,
          amount: body.amountNgnKobo / 100,
          currency: "NGN",
          redirect_url: `${process.env.WEB_URL}/tip?status=complete`,
          customer: { email: body.email ?? "tips@trice.getcleanroom.xyz" },
          customizations: { title: "Trice", description: "A tip for Trice" },
        }),
      });

      if (!res.ok) throw new Error(`Flutterwave link creation failed: ${res.status}`);
      const data = (await res.json()) as { data: { link: string } };

      await db.insert(payments).values({
        provider: "flutterwave",
        providerReference: txRef,
        amountMinor: body.amountNgnKobo,
        currency: "NGN",
        status: "pending",
      });

      return { url: data.data.link };
    },
    { body: t.Object({ amountNgnKobo: t.Number(), email: t.Optional(t.String()) }) },
  )
  .post(
    "/nowpayments/link",
    async ({ body }) => {
      const orderId = `trice-${crypto.randomUUID()}`;

      // Priced in USD and left for the invoice page to handle coin
      // selection + conversion — simplest correct behavior for "supports
      // crypto too" without Trice pricing dozens of coins itself.
      const usdAmount = await ngnToUsd(body.amountNgnKobo / 100);

      const res = await fetch("https://api.nowpayments.io/v1/invoice", {
        method: "POST",
        headers: {
          "x-api-key": process.env.NOWPAYMENTS_API_KEY!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          price_amount: usdAmount,
          price_currency: "usd",
          order_id: orderId,
          success_url: `${process.env.WEB_URL}/tip?status=complete`,
          ipn_callback_url: `${process.env.SERVICE_URL}/payments/nowpayments/webhook`,
        }),
      });

      if (!res.ok) throw new Error(`NOWPayments invoice creation failed: ${res.status}`);
      const data = (await res.json()) as { invoice_url: string };

      await db.insert(payments).values({
        provider: "nowpayments",
        providerReference: orderId,
        amountMinor: Math.round(usdAmount * 100),
        currency: "USD",
        status: "pending",
      });

      return { url: data.invoice_url };
    },
    { body: t.Object({ amountNgnKobo: t.Number() }) },
  )
  // Flutterwave signs webhooks with a shared secret in the `verif-hash` header.
  .post("/flutterwave/webhook", async ({ headers, body, set }) => {
    if (headers["verif-hash"] !== process.env.FLUTTERWAVE_WEBHOOK_SECRET) {
      set.status = 401;
      return;
    }
    const event = body as { data: { tx_ref: string; status: string } };
    if (event.data.status === "successful") {
      await db
        .update(payments)
        .set({ status: "confirmed" })
        .where(eq(payments.providerReference, event.data.tx_ref));
    }
    return { received: true };
  })
  // NOWPayments signs the raw body with HMAC-SHA512 using your IPN secret.
  .post("/nowpayments/webhook", async ({ headers, body, set }) => {
    const signature = headers["x-nowpayments-sig"] ?? "";
    const expected = createHmac("sha512", process.env.NOWPAYMENTS_IPN_SECRET!)
      .update(JSON.stringify(body))
      .digest("hex");

    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expected);
    if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
      set.status = 401;
      return;
    }

    const event = body as { order_id: string; payment_status: string };
    if (event.payment_status === "finished") {
      await db
        .update(payments)
        .set({ status: "confirmed" })
        .where(eq(payments.providerReference, event.order_id));
    }
    return { received: true };
  });
