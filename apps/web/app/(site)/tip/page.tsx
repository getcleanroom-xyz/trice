"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const AMOUNTS_NGN = [3000, 5000, 10000]; // kobo-free display; sent as kobo to the service

// Both link-generation calls hit the `service` app (Bun + Elysia), which
// talks to Flutterwave / NOWPayments and returns a hosted checkout URL. The
// web app never touches a card number, a wallet key, or crypto directly —
// see apps/service/src/routes/payments.ts.
export default function TipPage() {
  const [amount, setAmount] = useState(5000);
  const [pending, setPending] = useState<"fiat" | "crypto" | null>(null);

  async function tip(method: "fiat" | "crypto") {
    setPending(method);
    const base = process.env.NEXT_PUBLIC_SERVICE_URL;
    const endpoint =
      method === "fiat" ? `${base}/payments/flutterwave/link` : `${base}/payments/nowpayments/link`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountNgnKobo: amount * 100 }),
    });
    const { url } = await res.json();
    window.location.href = url;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <span className="mb-10 font-serif text-lg italic">Trice</span>
      <h1 className="mb-2 font-serif text-2xl text-foreground">
        Buy tomorrow&rsquo;s card a coffee
      </h1>
      <p className="mb-7 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
        Trice stays free, no paywall, ever. If a day&rsquo;s card was worth more than
        fifteen minutes, this is where that goes.
      </p>

      <div className="mb-4 flex gap-2.5">
        {AMOUNTS_NGN.map((n) => (
          <button
            key={n}
            onClick={() => setAmount(n)}
            className={cn(
              "rounded-sm border px-4 py-2.5 font-mono text-[13px] text-foreground",
              amount === n ? "border-primary" : "border-border",
            )}
          >
            ₦{n.toLocaleString()}
          </button>
        ))}
      </div>

      <div className="flex gap-2.5">
        <Button disabled={pending !== null} onClick={() => tip("fiat")}>
          {pending === "fiat" ? "One moment…" : "Pay with card / bank"}
        </Button>
        <Button
          variant="secondary"
          disabled={pending !== null}
          onClick={() => tip("crypto")}
        >
          {pending === "crypto" ? "One moment…" : "Pay with crypto"}
        </Button>
      </div>
    </main>
  );
}
