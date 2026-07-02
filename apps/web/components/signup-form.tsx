"use client";

import { useActionState } from "react";
import { subscribe, type SubscribeState } from "@/app/actions/subscribe";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const initialState: SubscribeState = { ok: false };

export function SignupForm() {
  const [state, formAction, pending] = useActionState(subscribe, initialState);

  if (state.ok) {
    return (
      <p className="font-serif text-lg text-foreground">
        {state.alreadySubscribed
          ? "Already on the roll — a new link arrives each morning."
          : "You&rsquo;re on the roll — check your inbox."}
      </p>
    );
  }

  return (
    <form action={formAction} className="max-w-sm">
      <div className="flex">
        <Input
          type="email"
          name="email"
          placeholder="name@company.com"
          required
          className="rounded-r-none border-r-0"
        />
        <Button type="submit" disabled={pending} className="rounded-l-none whitespace-nowrap">
          {pending ? "Joining…" : "Join the roll"}
        </Button>
      </div>
      {state.error && <p className="mt-2 text-xs text-destructive">{state.error}</p>}
      <p className="mt-2 font-mono text-[10px] text-muted-foreground">
        no password, ever — a new link arrives each morning
      </p>
    </form>
  );
}
