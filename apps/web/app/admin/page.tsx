import Link from "next/link";
import { listTopics, listDays } from "@/app/admin/content-actions";
import { buttonVariants } from "@/components/ui/button";

export default async function AdminPage() {
  const [topics, days] = await Promise.all([listTopics(), listDays()]);
  const now = Date.now();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-10 flex items-center justify-between">
        <span className="font-serif text-lg italic">Trice / admin</span>
        <div className="flex gap-3">
          <Link href="/admin/topics/new" className={buttonVariants({ variant: "secondary" })}>
            New topic
          </Link>
          <Link href="/admin/days/new" className={buttonVariants()}>
            New day
          </Link>
        </div>
      </div>

      <section className="mb-10">
        <h2 className="mb-3 font-mono text-xs text-primary">topics</h2>
        <div className="divide-y divide-border rounded-sm border border-border">
          {topics.map((t) => (
            <div key={t.id} className="p-3 text-sm text-foreground">
              {t.title}
            </div>
          ))}
          {topics.length === 0 && (
            <p className="p-3 text-sm text-muted-foreground">No topics yet.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-mono text-xs text-primary">days</h2>
        <div className="divide-y divide-border rounded-sm border border-border">
          {days.map((d) => {
            const status =
              d.expiresAt.getTime() < now
                ? "expired"
                : d.publishAt.getTime() > now
                  ? "scheduled"
                  : "live";
            return (
              <div key={d.id} className="flex items-center justify-between p-3 text-sm">
                <span className="text-foreground">
                  day {d.dayNumber} &middot; {d.title}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">{status}</span>
              </div>
            );
          })}
          {days.length === 0 && (
            <p className="p-3 text-sm text-muted-foreground">No days published yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}
