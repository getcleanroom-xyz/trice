import Link from "next/link";
import { nextTopicSortOrder } from "@/app/admin/content-actions";
import { NewTopicForm } from "./form";

export default async function NewTopicPage() {
  const suggestedSortOrder = await nextTopicSortOrder();

  return (
    <main className="mx-auto max-w-lg px-4 sm:px-6 py-8 sm:py-12">
      <span className="mb-8 block font-serif text-lg italic">
        <Link href="/" className="hover:text-primary">Trice</Link>{" "}
        / <Link href="/admin" className="hover:text-primary">admin</Link>{" "}
        / new topic
      </span>
      <h1 className="mb-6 font-serif text-2xl text-foreground">New topic</h1>
      <NewTopicForm suggestedSortOrder={suggestedSortOrder} />
    </main>
  );
}
