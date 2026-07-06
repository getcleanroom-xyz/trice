"use client";

import { useState } from "react";
import { Markdown } from "@/components/ui/markdown";
import { GradeForm } from "./grade-form";

type GradingTask = {
  id: string;
  subscriberEmail: string;
  dayTitle: string;
  dayNumber: number;
  taskPrompt: string;
  taskSubmission: string;
  taskGrade: string | null;
  score: number;
};

function GradingPanel({ tasks: initial }: { tasks: GradingTask[] }) {
  const [tasks, setTasks] = useState(initial);

  function handleGrade(attemptId: string, grade: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === attemptId ? { ...t, taskGrade: grade } : t)),
    );
  }

  const ungraded = tasks.filter((t) => !t.taskGrade);
  const graded = tasks.filter((t) => t.taskGrade);

  if (tasks.length === 0) {
    return <p className="text-sm text-muted-foreground">No task submissions yet.</p>;
  }

  return (
    <>
      {ungraded.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 font-mono text-[10px] tracking-widest text-primary/70 uppercase">
            Need grading
          </h2>
          <div className="flex flex-col gap-4">
            {ungraded.map((task) => (
              <div key={task.id} className="rounded-sm border border-border p-4">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <p className="mb-0.5 font-mono text-[10px] text-muted-foreground">
                      day {task.dayNumber} · {task.subscriberEmail}
                    </p>
                    <p className="font-serif text-sm text-foreground">{task.dayTitle}</p>
                  </div>
                  <span className="shrink-0 rounded-sm bg-destructive/10 px-2 py-0.5 font-mono text-[9px] text-destructive">
                    ungraded
                  </span>
                </div>
                <div className="mb-3 rounded-sm bg-secondary/50 p-3">
                  <p className="mb-1 font-mono text-[9px] text-muted-foreground">task prompt</p>
                  {task.taskPrompt ? (
                    <Markdown>{task.taskPrompt}</Markdown>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No task prompt found for this day.</p>
                  )}
                </div>
                <div className="mb-3 rounded-sm bg-background p-3">
                  <p className="mb-1 font-mono text-[9px] text-muted-foreground">submission</p>
                  <div className="text-sm leading-relaxed text-foreground/80">
                    <Markdown>{task.taskSubmission}</Markdown>
                  </div>
                </div>
                <GradeForm attemptId={task.id} currentGrade={task.taskGrade ?? ""} onGrade={(grade) => handleGrade(task.id, grade)} />
              </div>
            ))}
          </div>
        </section>
      )}

      {graded.length > 0 && (
        <section>
          <h2 className="mb-4 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
            Graded
          </h2>
          <div className="flex flex-col gap-3">
            {graded.map((task) => (
              <div key={task.id} className="rounded-sm border border-border p-4 opacity-60">
                <div className="mb-1 flex items-start justify-between gap-3">
                  <div>
                    <p className="mb-0.5 font-mono text-[10px] text-muted-foreground">
                      day {task.dayNumber} · {task.subscriberEmail}
                    </p>
                    <p className="font-serif text-sm text-foreground">{task.dayTitle}</p>
                  </div>
                  <span className="shrink-0 rounded-sm bg-primary/10 px-2 py-0.5 font-mono text-[9px] text-primary">
                    graded
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">{task.taskGrade}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

export { GradingPanel, type GradingTask };
