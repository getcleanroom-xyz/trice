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
      <div>
        <p className="font-serif text-lg text-foreground">
          {state.alreadySubscribed
            ? "Already on the roll — a new link arrives each morning."
            : "You're on the roll — check your inbox."}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 font-mono text-[11px] text-primary hover:underline"
        >
          sign up another email →
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="w-full max-w-sm">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          type="email"
          name="email"
          placeholder="name@company.com"
          required
          className="sm:rounded-r-none sm:border-r-0"
        />
        <Button type="submit" disabled={pending} className="sm:rounded-l-none whitespace-nowrap">
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
