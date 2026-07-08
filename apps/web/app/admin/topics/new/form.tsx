"use client";

import { useState } from "react";
import { useActionState } from "react";
import { createTopic, type CreateTopicState } from "@/app/admin/topic-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MarkdownEditor } from "@/components/ui/markdown-editor";

const initialState: CreateTopicState = { ok: false };

export function NewTopicForm({ suggestedSortOrder: initial }: { suggestedSortOrder: number }) {
  const [state, formAction, pending] = useActionState(createTopic, initialState);
  const [description, setDescription] = useState("");

  return (
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
        <Input id="sortOrder" name="sortOrder" type="number" defaultValue={initial} />
      </div>

      {state.error && <p className="text-xs text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Create topic"}
      </Button>
    </form>
  );
}
