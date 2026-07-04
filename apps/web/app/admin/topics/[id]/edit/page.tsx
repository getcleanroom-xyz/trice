import { notFound } from "next/navigation";
import { getTopic, topicHasDays } from "@/app/admin/content-actions";
import { TopicEditForm } from "@/components/admin/topic-edit-form";

export const dynamic = "force-dynamic";

export default async function EditTopicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const topic = await getTopic(id);
  if (!topic) notFound();

  const hasDays = await topicHasDays(id);

  return (
    <main className="mx-auto max-w-lg px-4 sm:px-6 py-8 sm:py-12">
      <span className="mb-8 block font-serif text-lg italic">
        <a href="/" className="hover:text-primary">Trice</a>{" "}
        / <a href="/admin" className="hover:text-primary">admin</a>{" "}
        / edit topic
      </span>
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
