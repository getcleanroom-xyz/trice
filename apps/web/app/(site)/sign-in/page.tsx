"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestLink, type RequestLinkState } from "@/app/actions/request-link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const initialState: RequestLinkState = { ok: false };

export default function SignInPage() {
  const [state, formAction, pending] = useActionState(requestLink, initialState);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 sm:px-6 text-center">
      <Link href="/" className="mb-11 font-serif text-lg italic text-foreground hover:text-primary">Trice</Link>

      {state.ok ? (
        <p className="font-serif text-xl text-foreground">
          If that email is on the roll, today's link is on its way.
        </p>
      ) : (
        <>
          <h1 className="mb-2 font-serif text-2xl text-foreground">
              Where's today's card?
          </h1>
          <p className="mb-7 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
              There's no password to remember. Enter your email and we'll send
            today's link straight over.
          </p>
          <form action={formAction} className="mb-3.5 flex w-full max-w-sm">
            <Input
              type="email"
              name="email"
              placeholder="name@company.com"
              required
              className="rounded-r-none border-r-0"
            />
            <Button type="submit" disabled={pending} className="rounded-l-none whitespace-nowrap">
              {pending ? "Sending…" : "Send my link"}
            </Button>
          </form>
          <p className="font-mono text-[10px] text-muted-foreground">
            the link is only good for today's card
          </p>
        </>
      )}
    </main>
  );
}
