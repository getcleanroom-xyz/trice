"use client";

import { useActionState } from "react";
import { createTopic, type CreateTopicState } from "@/app/admin/topic-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const initialState: CreateTopicState = { ok: false };

export default function NewTopicPage() {
  const [state, formAction, pending] = useActionState(createTopic, initialState);

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <span className="mb-8 block font-serif text-lg italic">Trice / admin</span>
      <h1 className="mb-6 font-serif text-2xl text-foreground">New topic</h1>

      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">title</Label>
          <Input id="title" name="title" placeholder="CDN" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">description</Label>
          <Textarea id="description" name="description" rows={3} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sortOrder">sort order</Label>
          <Input id="sortOrder" name="sortOrder" type="number" defaultValue={1} />
        </div>

        {state.error && <p className="text-xs text-destructive">{state.error}</p>}

        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Create topic"}
        </Button>
      </form>
    </main>
  );
}
