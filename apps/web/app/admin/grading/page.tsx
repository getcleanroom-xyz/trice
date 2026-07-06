import Link from "next/link";
import { listUngradedTasks } from "@/app/admin/content-actions";
import { GradeForm } from "./grade-form";

export const dynamic = "force-dynamic";

export default async function GradingPage() {
  const tasks = await listUngradedTasks();

  const ungraded = tasks.filter((t) => !t.taskGrade);
  const graded = tasks.filter((t) => t.taskGrade);

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8">
        <span className="font-serif text-lg italic">
          <Link href="/" className="hover:text-primary">Trice</Link>{" "}
          / <Link href="/admin" className="hover:text-primary">admin</Link>{" "}
          / grading
        </span>
      </div>

      <h1 className="mb-1 font-serif text-2xl text-foreground">Task grading</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        {ungraded.length} ungraded submission{ungraded.length !== 1 && "s"}
        {graded.length > 0 && ` · ${graded.length} graded`}
      </p>

      {tasks.length === 0 && (
        <p className="text-sm text-muted-foreground">No task submissions yet.</p>
      )}

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
                <details className="mb-3">
                  <summary className="cursor-pointer font-mono text-[10px] text-muted-foreground hover:text-foreground">
                    Show task
                  </summary>
                  <p className="mt-2 whitespace-pre-wrap rounded-sm bg-secondary/50 p-3 font-serif text-sm leading-relaxed text-foreground/80">
                    {task.taskPrompt}
                  </p>
                </details>
                <div className="mb-3 rounded-sm bg-background p-3">
                  <p className="mb-1 font-mono text-[9px] text-muted-foreground">submission</p>
                  <p className="whitespace-pre-wrap font-serif text-sm leading-relaxed text-foreground/80">
                    {task.taskSubmission}
                  </p>
                </div>
                <GradeForm attemptId={task.id} currentGrade={task.taskGrade ?? ""} />
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
    </main>
  );
}
