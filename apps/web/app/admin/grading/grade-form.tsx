"use client";

import { useState, useTransition } from "react";
import { gradeTask } from "@/app/admin/content-actions";
import { Button } from "@/components/ui/button";
import { MarkdownEditor } from "@/components/ui/markdown-editor";

function GradeForm({ attemptId, currentGrade, onGrade }: { attemptId: string; currentGrade: string; onGrade?: (grade: string) => void }) {
  const [grade, setGrade] = useState(currentGrade);
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!grade.trim()) return;
    startTransition(async () => {
      await gradeTask(attemptId, grade.trim());
      onGrade?.(grade.trim());
      setDone(true);
    });
  }

  if (done) {
    return (
      <p className="text-xs text-primary">Grade saved.</p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <MarkdownEditor value={grade} onChange={setGrade} placeholder="Write feedback / grade..." minRows={2} />
      <Button type="submit" disabled={pending || !grade.trim()} size="sm">
        {pending ? "Saving…" : "Submit grade"}
      </Button>
    </form>
  );
}

export { GradeForm };
