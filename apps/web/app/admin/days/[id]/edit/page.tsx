import { notFound } from "next/navigation";
import { getDay, getDayQuestions, listTopics } from "@/app/admin/content-actions";
import { DayForm } from "@/components/admin/day-form";

export const dynamic = "force-dynamic";

export default async function EditDayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [day, topics] = await Promise.all([getDay(id), listTopics()]);

  if (!day) notFound();

  const questions = await getDayQuestions(day.id);

  const dayData = {
    topicId: day.topicId,
    dayNumber: day.dayNumber,
    slug: day.slug,
    title: day.title,
    videoUrls: (day.videoUrls as string[]).map((url) => ({ url })),
    intro: day.intro,
    objectives: (day.objectives as string[]).map((value) => ({ value })),
    summary: day.summary,
    notes: day.notes,
    publishAt: day.publishAt.toISOString().slice(0, 16),
    graceHours: Math.round((day.expiresAt.getTime() - day.publishAt.getTime()) / (60 * 60 * 1000)),
    questions: questions.map((q) => ({
      prompt: q.prompt,
      choices: q.choices as string[],
      correctIndex: q.correctIndex,
    })),
    task: "",
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
