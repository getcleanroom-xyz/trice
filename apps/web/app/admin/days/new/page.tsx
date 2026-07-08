import { listTopics, nextDayNumber } from "@/app/admin/content-actions";
import { AppHeader } from "@/components/app-header";
import { DayForm } from "@/components/admin/day-form";

export const dynamic = "force-dynamic";

export default async function NewDayPage() {
  const topicsResult = await listTopics();
  const topics = topicsResult.data;
  const suggestions: Record<string, number> = {};
  for (const t of topics) {
    suggestions[t.id] = await nextDayNumber(t.id);
  }
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <AppHeader breadcrumbs={[{ href: "/admin", label: "admin" }, { label: "new day" }]} />
      <h1 className="mb-6 font-serif text-2xl text-foreground">New day</h1>
      <DayForm topics={topics.map((t) => ({ id: t.id, title: t.title }))} dayNumberSuggestions={suggestions} />
    </main>
  );
}
