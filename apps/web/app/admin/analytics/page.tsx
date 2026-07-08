import Link from "next/link";
import { db } from "@/lib/db/client";
import { subscribers, days, emailSends, quizAttempts } from "@/lib/db/schema";
import { eq, sql, count, isNull } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function getStats() {
  const totalSubs = await db.select({ v: count() }).from(subscribers).then(r => r[0].v);
  const activeSubs = await db.select({ v: count() }).from(subscribers).where(isNull(subscribers.unsubscribedAt)).then(r => r[0].v);

  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const monthAgo = new Date(Date.now() - 30 * 86400000);
  const subsThisWeek = await db.select({ v: count() }).from(subscribers).where(sql`${subscribers.createdAt} >= ${weekAgo}`).then(r => r[0].v);
  const subsThisMonth = await db.select({ v: count() }).from(subscribers).where(sql`${subscribers.createdAt} >= ${monthAgo}`).then(r => r[0].v);

  const totalDays = await db.select({ v: count() }).from(days).then(r => r[0].v);
  const liveDays = await db.select({ v: count() }).from(days).where(sql`${days.publishAt} <= now() AND ${days.expiresAt} >= now()`).then(r => r[0].v);

  const emailsSent = await db.select({ v: count() }).from(emailSends).where(eq(emailSends.status, "sent")).then(r => r[0].v);

  const quizTotal = await db.select({ v: count() }).from(quizAttempts).then(r => r[0].v);
  const gradedTasks = await db.select({ v: count() }).from(quizAttempts).where(sql`${quizAttempts.taskGrade} IS NOT NULL`).then(r => r[0].v);

  const streaks: { range: string; subquery: Promise<{ v: number }[]> }[] = [
    { range: "≥ 1 day", subquery: db.select({ v: count() }).from(subscribers).where(sql`${subscribers.currentStreak} >= 1`) },
    { range: "≥ 7 days", subquery: db.select({ v: count() }).from(subscribers).where(sql`${subscribers.currentStreak} >= 7`) },
    { range: "≥ 30 days", subquery: db.select({ v: count() }).from(subscribers).where(sql`${subscribers.currentStreak} >= 30`) },
  ];
  const streakData = await Promise.all(streaks.map(async (s) => ({ range: s.range, count: (await s.subquery)[0].v })));

  return {
    totalSubs, activeSubs, subsThisWeek, subsThisMonth,
    totalDays, liveDays, emailsSent, quizTotal, gradedTasks, streakData,
  };
}

export default async function AnalyticsPage() {
  const stats = await getStats();

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
      <span className="mb-8 block font-serif text-lg italic">
        <Link href="/" className="hover:text-primary">Trice</Link>{" "}
        / <Link href="/admin" className="hover:text-primary">admin</Link>{" "}
        / analytics
      </span>
      <h1 className="mb-6 font-serif text-2xl text-foreground">Analytics</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatBox label="Subscribers" value={stats.totalSubs} />
        <StatBox label="Active" value={stats.activeSubs} />
        <StatBox label="This week" value={stats.subsThisWeek} />
        <StatBox label="This month" value={stats.subsThisMonth} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatBox label="Days published" value={stats.totalDays} />
        <StatBox label="Currently live" value={stats.liveDays} />
        <StatBox label="Emails sent" value={stats.emailsSent} />
        <StatBox label="Quiz attempts" value={stats.quizTotal} />
      </div>

      <h2 className="mb-3 font-serif text-lg text-foreground">Streaks</h2>
      <div className="grid grid-cols-3 gap-3 mb-8">
        {stats.streakData.map((s) => (
          <StatBox key={s.range} label={s.range} value={s.count} />
        ))}
      </div>

      <h2 className="mb-3 font-serif text-lg text-foreground">Grading</h2>
      <div className="grid grid-cols-2 gap-3">
        <StatBox label="Submissions" value={stats.quizTotal} />
        <StatBox label="Graded" value={stats.gradedTasks} />
      </div>
    </main>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-sm border border-border p-4">
      <div className="font-mono text-[10px] text-muted-foreground mb-1">{label}</div>
      <div className="font-serif text-2xl text-foreground">{value}</div>
    </div>
  );
}
