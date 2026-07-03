"use client";

import { useActionState } from "react";
import { createTopic, type CreateTopicState } from "@/app/admin/topic-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const initialState: CreateTopicState = { ok: false };

export default function NewTopicPage() {
  const [state, formAction, pending] = useActionState(createTopic, initialState);

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <span className="mb-8 block font-serif text-lg italic">Trice / admin</span>
      <h1 className="mb-6 font-serif text-2xl text-foreground">New topic</h1>

      <form action={formAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] text-muted-foreground">title</span>
          <Input name="title" placeholder="CDN" required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] text-muted-foreground">description</span>
          <textarea
            name="description"
            rows={3}
            required
            className="rounded-sm border border-input bg-transparent px-3.5 py-2 text-sm text-foreground"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] text-muted-foreground">sort order</span>
          <Input name="sortOrder" type="number" defaultValue={1} />
        </label>

        {state.error && <p className="text-xs text-destructive">{state.error}</p>}

        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Create topic"}
        </Button>
      </form>
    </main>
  );
}
