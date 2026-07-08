import { notFound } from "next/navigation";
import { db } from "@/lib/db/client";
import { quizTasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getDay, getDayQuestions, listTopics } from "@/app/admin/content-actions";
import { DayForm } from "@/components/admin/day-form";

function pad(n: number) { return String(n).padStart(2, "0"); }
function toLocalISO(d: Date): string {
  const wat = new Date(d.getTime() + 60 * 60 * 1000);
  return `${wat.getFullYear()}-${pad(wat.getMonth() + 1)}-${pad(wat.getDate())}T${pad(wat.getHours())}:${pad(wat.getMinutes())}`;
}

export const dynamic = "force-dynamic";

export default async function EditDayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [day, topicsResult] = await Promise.all([getDay(id), listTopics()]);
  const topics = topicsResult.data;

  if (!day) notFound();

  const [questions, existingTask] = await Promise.all([
    getDayQuestions(day.id),
    db.query.quizTasks.findFirst({ where: eq(quizTasks.dayId, day.id) }),
  ]);

  const dayData = {
    topicId: day.topicId,
    dayNumber: day.dayNumber,
    slug: day.slug,
    title: day.title,
    videoUrls: (day.videoUrls as string[]).map((url) => ({ url })),
    videoDurations: (day.videoDurations as number[]) ?? [],
    intro: day.intro,
    objectives: (day.objectives as string[]).map((value) => ({ value })),
    summary: day.summary,
    notes: day.notes,
    publishAt: toLocalISO(day.publishAt),
    graceHours: Math.round((day.expiresAt.getTime() - day.publishAt.getTime()) / (60 * 60 * 1000)),
    questions: questions.map((q) => ({
      prompt: q.prompt,
      choices: q.choices as string[],
      correctIndex: q.correctIndex,
    })),
    task: existingTask?.prompt ?? "",
  };

  return (
    <main className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-12">
      <span className="mb-8 block font-serif text-lg italic">
        <a href="/" className="hover:text-primary">Trice</a>{" "}
        / <a href="/admin" className="hover:text-primary">admin</a>{" "}
        / edit day
      </span>
      <h1 className="mb-6 font-serif text-2xl text-foreground">Edit day</h1>
      <DayForm topics={topics.map((t) => ({ id: t.id, title: t.title }))} dayData={dayData} dayId={day.id} />
    </main>
  );
}
