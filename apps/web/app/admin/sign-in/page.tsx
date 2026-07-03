"use client";

import { useActionState } from "react";
import { requestAdminLink, type AdminAuthState } from "@/app/admin/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const initialState: AdminAuthState = { ok: false };

export default function AdminSignInPage() {
  const [state, formAction, pending] = useActionState(requestAdminLink, initialState);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center px-6 text-center">
      <span className="mb-10 font-serif text-lg italic">Trice / admin</span>

      {state.ok ? (
        <p className="font-serif text-lg text-foreground">
          If that's the admin address, a link just went out. It's good for
          fifteen minutes.
        </p>
      ) : (
        <form action={formAction} className="flex w-full">
          <Input
            type="email"
            name="email"
            placeholder="admin email"
            required
            className="rounded-r-none border-r-0"
          />
          <Button type="submit" disabled={pending} className="rounded-l-none whitespace-nowrap">
            {pending ? "Sending…" : "Send link"}
          </Button>
        </form>
      )}
    </main>
  );
}
