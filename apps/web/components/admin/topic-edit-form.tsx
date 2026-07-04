"use client";

import { useActionState } from "react";
import { updateTopic, type UpdateTopicState } from "@/app/admin/topic-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

const initialState: UpdateTopicState = { ok: false };

export function TopicEditForm({
  topicId,
  initialTitle,
  initialDescription,
  initialSortOrder,
  hasDays,
}: {
  topicId: string;
  initialTitle: string;
  initialDescription: string;
  initialSortOrder: number;
  hasDays: boolean;
}) {
  const [state, formAction, pending] = useActionState(updateTopic.bind(null, topicId), initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">title</Label>
        <Input id="title" name="title" defaultValue={initialTitle} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">description</Label>
        <Textarea id="description" name="description" rows={3} defaultValue={initialDescription} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="sortOrder">sort order</Label>
        <Input id="sortOrder" name="sortOrder" type="number" defaultValue={initialSortOrder} />
      </div>

      {hasDays && (
        <p className="text-xs text-muted-foreground bg-secondary px-3 py-2 rounded-sm">
          This topic has days associated with it. Deleting it will leave those days orphaned.
        </p>
      )}

      {state.error && <p className="text-xs text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
