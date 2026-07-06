"use client";

import { useState } from "react";
import Link from "next/link";
import { useActionState } from "react";
import { createTopic, type CreateTopicState } from "@/app/admin/topic-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MarkdownEditor } from "@/components/ui/markdown-editor";

const initialState: CreateTopicState = { ok: false };

export default function NewTopicPage() {
  const [state, formAction, pending] = useActionState(createTopic, initialState);
  const [description, setDescription] = useState("");

  return (
    <main className="mx-auto max-w-lg px-4 sm:px-6 py-8 sm:py-12">
      <span className="mb-8 block font-serif text-lg italic">
        <Link href="/" className="hover:text-primary">Trice</Link>{" "}
        / <Link href="/admin" className="hover:text-primary">admin</Link>{" "}
        / new topic
      </span>
      <h1 className="mb-6 font-serif text-2xl text-foreground">New topic</h1>

      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">title</Label>
          <Input id="title" name="title" placeholder="CDN" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">description</Label>
          <MarkdownEditor value={description} onChange={setDescription} placeholder="Describe this topic…" minRows={3} />
          <input type="hidden" name="description" value={description} />
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
