import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { topics as topicsTable } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { listTopics, listDays, reorderTopics, reorderDays } from "@/app/admin/content-actions";
import { buttonVariants } from "@/components/ui/button";
import { DraggableDayList } from "@/components/admin/draggable-day-list";
import { DraggableTopicList } from "@/components/admin/draggable-topic-list";
import { AdminTabs } from "@/components/admin/admin-controls";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; page?: string; tab?: string; topic?: string }>;
}) {
  const { q, sort, page, tab, topic } = await searchParams;

  if (tab === "grading") redirect("/admin/grading");
  if (tab === "analytics") redirect("/admin/analytics");

  const pageNum = Math.max(1, Number(page) || 1);
  const showTopics = tab !== "days";

  const [topicsResult, daysResult] = await Promise.all([
    listTopics({ q, page: showTopics ? pageNum : 1 }),
    listDays({ q, sort, page: showTopics ? 1 : pageNum }),
  ]);

  const allTopics = await db.query.topics.findMany({ orderBy: asc(topicsTable.sortOrder) });

  async function handleReorderTopics(ids: string[]) {
    "use server";
    await reorderTopics(ids);
  }

  async function handleReorderDays(ids: string[]) {
    "use server";
    const topicId = topic ?? "";
    if (topicId) await reorderDays(topicId, ids);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8 sm:mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <span className="font-serif text-lg italic">
          <Link href="/" className="hover:text-primary">Trice</Link>{" "}
          / <Link href="/admin" className="hover:text-primary">admin</Link>
        </span>
        <div className="flex gap-3">
          <Link href="/admin/topics/new" className={buttonVariants({ variant: "secondary", size: "sm" })}>
            New topic
          </Link>
          <Link href="/admin/days/new" className={buttonVariants({ size: "sm" })}>
            New day
          </Link>
        </div>
      </div>

      <AdminTabs activeTab={showTopics ? "topics" : "days"} />

      {showTopics ? (
        <DraggableTopicList
          topics={topicsResult.data}
          total={topicsResult.total}
          page={topicsResult.page}
          totalPages={topicsResult.totalPages}
          q={q}
          onReorder={handleReorderTopics}
        />
      ) : (
        <>
          <div className="mb-3">
            <form method="GET" className="flex items-center gap-2">
              <input type="hidden" name="tab" value="days" />
              <select
                name="topic"
                defaultValue={topic ?? ""}
                onChange={(e) => { const p = new URLSearchParams(window.location.search); p.set("topic", e.target.value); p.delete("page"); window.location.search = p.toString(); }}
                className="h-9 rounded-sm border border-input bg-transparent px-3 py-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">All topics</option>
                {allTopics.map((t) => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
              <noscript><button type="submit" className="h-9 rounded-sm border border-input px-3 text-xs text-muted-foreground">Go</button></noscript>
            </form>
          </div>
          <DraggableDayList
            days={daysResult.data}
            total={daysResult.total}
            page={daysResult.page}
            totalPages={daysResult.totalPages}
            q={q}
            sort={sort}
            topicId={topic}
            onReorder={handleReorderDays}
          />
        </>
      )}
    </main>
  );
}
