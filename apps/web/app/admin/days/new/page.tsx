import { listTopics } from "@/app/admin/content-actions";
import { DayForm } from "@/components/admin/day-form";

export default async function NewDayPage() {
  const topics = await listTopics();
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <span className="mb-8 block font-serif text-lg italic">Trice / admin</span>
      <h1 className="mb-6 font-serif text-2xl text-foreground">New day</h1>
      <DayForm topics={topics.map((t) => ({ id: t.id, title: t.title }))} />
    </main>
  );
}
