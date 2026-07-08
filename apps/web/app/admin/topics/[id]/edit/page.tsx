import { notFound } from "next/navigation";
import { getTopic, topicHasDays } from "@/app/admin/content-actions";
import { AppHeader } from "@/components/app-header";
import { TopicEditForm } from "@/components/admin/topic-edit-form";

export const dynamic = "force-dynamic";

export default async function EditTopicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const topic = await getTopic(id);
  if (!topic) notFound();

  const hasDays = await topicHasDays(id);

  return (
    <main className="mx-auto max-w-lg px-4 sm:px-6 py-8 sm:py-12">
      <AppHeader breadcrumbs={[{ href: "/admin", label: "admin" }, { label: "edit topic" }]} />
      <h1 className="mb-6 font-serif text-2xl text-foreground">Edit topic</h1>
      <TopicEditForm
        topicId={topic.id}
        initialTitle={topic.title}
        initialDescription={topic.description}
        initialSortOrder={topic.sortOrder}
        hasDays={hasDays}
      />
    </main>
  );
}
