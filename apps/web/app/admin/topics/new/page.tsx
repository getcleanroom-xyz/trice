import { nextTopicSortOrder } from "@/app/admin/content-actions";
import { AppHeader } from "@/components/app-header";
import { NewTopicForm } from "./form";

export const dynamic = "force-dynamic";

export default async function NewTopicPage() {
  const suggestedSortOrder = await nextTopicSortOrder();

  return (
    <main className="mx-auto max-w-lg px-4 sm:px-6 py-8 sm:py-12">
      <AppHeader breadcrumbs={[{ href: "/admin", label: "admin" }, { label: "new topic" }]} />
      <h1 className="mb-6 font-serif text-2xl text-foreground">New topic</h1>
      <NewTopicForm suggestedSortOrder={suggestedSortOrder} />
    </main>
  );
}
