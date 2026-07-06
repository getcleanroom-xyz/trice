"use client";

import { useState, useTransition } from "react";
import { gradeTask } from "@/app/admin/content-actions";
import { Button } from "@/components/ui/button";

function GradeForm({ attemptId, currentGrade }: { attemptId: string; currentGrade: string }) {
  const [grade, setGrade] = useState(currentGrade);
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!grade.trim()) return;
    startTransition(async () => {
      await gradeTask(attemptId, grade.trim());
      setDone(true);
    });
  }

  if (done) {
    return (
      <p className="text-xs text-primary">Grade saved.</p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={grade}
        onChange={(e) => setGrade(e.target.value)}
        placeholder="Write feedback / grade..."
        className="flex-1 h-9 rounded-sm border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      <Button type="submit" disabled={pending || !grade.trim()} size="sm">
        {pending ? "Saving…" : "Submit grade"}
      </Button>
    </form>
  );
}

export { GradeForm };
