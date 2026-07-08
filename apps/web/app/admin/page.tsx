import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { topics as topicsTable } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { listTopics, listDays, reorderTopics, reorderDays } from "@/app/admin/content-actions";
import { AppHeader } from "@/components/app-header";
import { buttonVariants } from "@/components/ui/button";
import { DraggableDayList } from "@/components/admin/draggable-day-list";
import { DraggableTopicList } from "@/components/admin/draggable-topic-list";
import { AdminTabs } from "@/components/admin/admin-controls";
import { TopicFilter } from "@/components/admin/topic-filter";

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
    listDays({ q, sort, page: showTopics ? 1 : pageNum, topic }),
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
      <AppHeader breadcrumbs={[{ label: "admin" }]}>
        <Link href="/admin/topics/new" className={buttonVariants({ variant: "secondary", size: "sm" })}>
          New topic
        </Link>
        <Link href="/admin/days/new" className={buttonVariants({ size: "sm" })}>
          New day
        </Link>
      </AppHeader>

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
            <TopicFilter topic={topic} allTopics={allTopics} />
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
