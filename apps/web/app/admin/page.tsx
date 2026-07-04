import Link from "next/link";
import { listTopics, listDays } from "@/app/admin/content-actions";
import { buttonVariants } from "@/components/ui/button";
import { AdminDayList } from "@/components/admin/admin-day-list";
import { AdminTopicList } from "@/components/admin/admin-topic-list";
import { AdminTabs } from "@/components/admin/admin-controls";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; page?: string; tab?: string }>;
}) {
  const { q, sort, page, tab } = await searchParams;
  const pageNum = Math.max(1, Number(page) || 1);
  const showTopics = tab !== "days";

  const [topicsResult, daysResult] = await Promise.all([
    listTopics({ q, page: showTopics ? pageNum : 1 }),
    listDays({ q, sort, page: showTopics ? 1 : pageNum }),
  ]);

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
        <AdminTopicList topics={topicsResult.data} total={topicsResult.total} page={topicsResult.page} totalPages={topicsResult.totalPages} q={q} />
      ) : (
        <AdminDayList days={daysResult.data} total={daysResult.total} page={daysResult.page} totalPages={daysResult.totalPages} q={q} sort={sort} />
      )}
    </main>
  );
}
