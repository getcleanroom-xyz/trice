"use client";

import { useState } from "react";
import Link from "next/link";
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
  const [error, setError] = useState<string | null>(null);

  async function tip(method: "fiat" | "crypto") {
    setPending(method);
    setError(null);
    try {
      const base = process.env.NEXT_PUBLIC_SERVICE_URL;
      const endpoint =
        method === "fiat" ? `${base}/payments/flutterwave/link` : `${base}/payments/nowpayments/link`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountNgnKobo: amount * 100 }),
      });
      if (!res.ok) throw new Error("Payment service unavailable");
      const { url } = await res.json();
      if (!url) throw new Error("No payment link returned");
      window.location.href = url;
    } catch {
      setError("Something went wrong. Please try again.");
      setPending(null);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 sm:px-6 text-center">
      <Link href="/" className="mb-10 font-serif text-lg italic text-foreground hover:text-primary">Trice</Link>
      <h1 className="mb-2 font-serif text-xl sm:text-2xl text-foreground">
        Buy tomorrow&rsquo;s card a coffee
      </h1>
      <p className="mb-7 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
        Trice stays free, no paywall, ever. If a day&rsquo;s card was worth more than
        fifteen minutes, this is where that goes.
      </p>

      <div className="mb-4 flex flex-wrap justify-center gap-2 sm:gap-2.5">
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

      <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
        <Button disabled={pending !== null} onClick={() => tip("fiat")} className="w-full sm:w-auto">
          {pending === "fiat" ? "One moment…" : "Pay with card / bank"}
        </Button>
        <Button
          variant="secondary"
          disabled={pending !== null}
          onClick={() => tip("crypto")}
          className="w-full sm:w-auto"
        >
          {pending === "crypto" ? "One moment…" : "Pay with crypto"}
        </Button>
      </div>
      {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
    </main>
  );
}
