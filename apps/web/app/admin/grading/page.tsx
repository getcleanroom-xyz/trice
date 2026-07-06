import Link from "next/link";
import { listUngradedTasks } from "@/app/admin/content-actions";
import { GradingPanel } from "./grading-panel";

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

      <GradingPanel tasks={tasks} />
    </main>
  );
}
