import Link from "next/link";
import { db } from "@/lib/db/client";
import { subscribers, days, emailSends, quizAttempts } from "@/lib/db/schema";
import { eq, sql, count, isNull } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function getStats() {
  const totalSubs = await db.select({ v: count() }).from(subscribers).then(r => r[0].v);
  const activeSubs = await db.select({ v: count() }).from(subscribers).where(isNull(subscribers.unsubscribedAt)).then(r => r[0].v);

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const subsThisWeek = await db.select({ v: count() }).from(subscribers).where(sql`${subscribers.createdAt} >= ${weekAgo}`).then(r => r[0].v);
  const subsThisMonth = await db.select({ v: count() }).from(subscribers).where(sql`${subscribers.createdAt} >= ${monthAgo}`).then(r => r[0].v);

  const totalDays = await db.select({ v: count() }).from(days).then(r => r[0].v);
  const liveDays = await db.select({ v: count() }).from(days).where(sql`${days.publishAt} <= now() AND ${days.expiresAt} >= now()`).then(r => r[0].v);

  const emailsSent = await db.select({ v: count() }).from(emailSends).where(eq(emailSends.status, "sent")).then(r => r[0].v);

  const quizTotal = await db.select({ v: count() }).from(quizAttempts).then(r => r[0].v);
  const gradedTasks = await db.select({ v: count() }).from(quizAttempts).where(sql`${quizAttempts.taskGrade} IS NOT NULL`).then(r => r[0].v);

  const streak1 = db.select({ v: count() }).from(subscribers).where(sql`${subscribers.currentStreak} >= 1`);
  const streak7 = db.select({ v: count() }).from(subscribers).where(sql`${subscribers.currentStreak} >= 7`);
  const streak30 = db.select({ v: count() }).from(subscribers).where(sql`${subscribers.currentStreak} >= 30`);
  const [[s1], [s7], [s30]] = await Promise.all([streak1, streak7, streak30]);

  return {
    totalSubs, activeSubs, subsThisWeek, subsThisMonth,
    totalDays, liveDays, emailsSent, quizTotal, gradedTasks,
    streak1: s1.v, streak7: s7.v, streak30: s30.v,
  };
}

function Bar({ value, max, className }: { value: number; max: number; className?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
      <div className={`h-full rounded-full transition-all ${className ?? "bg-primary/60"}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function SectionDivider() {
  return <div className="mb-6 mt-8 h-px w-full bg-gradient-to-r from-primary/40 via-border to-transparent" />;
}

function SectionHeading({ label }: { label: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="font-serif text-lg text-foreground">{label}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export default async function AnalyticsPage() {
  const s = await getStats();

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
      <span className="mb-8 block font-serif text-lg italic">
        <Link href="/" className="hover:text-primary">Trice</Link>
        <span className="text-muted-foreground"> / </span>
        <Link href="/admin" className="hover:text-primary">admin</Link>
        <span className="text-muted-foreground"> / </span>
        analytics
      </span>
      <h1 className="mb-2 font-serif text-2xl text-foreground">Analytics</h1>
      <p className="mb-8 text-sm text-muted-foreground">A pulse on the community</p>

      <SectionHeading label="Subscribers" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
        <StatBox label="Total" value={s.totalSubs} />
        <StatBox label="Active" value={s.activeSubs} />
        <StatBox label="This week" value={s.subsThisWeek} />
        <StatBox label="This month" value={s.subsThisMonth} />
      </div>
      <div className="mb-6 rounded-sm border border-border bg-card p-3">
        <div className="mb-1 flex items-center justify-between font-mono text-[10px] text-muted-foreground">
          <span>Active rate</span>
          <span>{s.totalSubs > 0 ? Math.round((s.activeSubs / s.totalSubs) * 100) : 0}%</span>
        </div>
        <Bar value={s.activeSubs} max={s.totalSubs} />
      </div>

      <SectionDivider />

      <SectionHeading label="Content" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatBox label="Days published" value={s.totalDays} />
        <StatBox label="Currently live" value={s.liveDays} />
        <StatBox label="Emails sent" value={s.emailsSent} />
        <StatBox label="Quiz attempts" value={s.quizTotal} />
      </div>

      <SectionDivider />

      <SectionHeading label="Streaks" />

      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatBox label="≥ 1 day" value={s.streak1} />
        <StatBox label="≥ 7 days" value={s.streak7} />
        <StatBox label="≥ 30 days" value={s.streak30} />
      </div>

      <div className="rounded-sm border border-border bg-card p-3">
        <div className="mb-2 flex items-center justify-between font-mono text-[10px] text-muted-foreground">
          <span>Retention funnel</span>
        </div>
        <div className="flex flex-col gap-2">
          <FunnelRow label="Viewed ≥ 1 day" value={s.streak1} max={s.activeSubs} />
          <FunnelRow label="Viewed ≥ 7 days" value={s.streak7} max={s.streak1} />
          <FunnelRow label="Viewed ≥ 30 days" value={s.streak30} max={s.streak7} />
        </div>
      </div>

      <SectionDivider />

      <SectionHeading label="Grading" />

      <div className="grid grid-cols-2 gap-3 mb-3">
        <StatBox label="Submissions" value={s.quizTotal} />
        <StatBox label="Graded" value={s.gradedTasks} />
      </div>
      <div className="rounded-sm border border-border bg-card p-3">
        <div className="mb-1 flex items-center justify-between font-mono text-[10px] text-muted-foreground">
          <span>Graded rate</span>
          <span>{s.quizTotal > 0 ? Math.round((s.gradedTasks / s.quizTotal) * 100) : 0}%</span>
        </div>
        <Bar value={s.gradedTasks} max={s.quizTotal} className="bg-primary/60" />
      </div>
    </main>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-sm border border-border bg-card p-4">
      <div className="font-mono text-[10px] text-muted-foreground tracking-wider mb-1">{label}</div>
      <div className="font-serif text-2xl text-foreground">{value}</div>
    </div>
  );
}

function FunnelRow({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 shrink-0 font-mono text-[10px] text-muted-foreground">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-primary/60 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-16 shrink-0 text-right font-mono text-[11px] text-foreground">{value}</span>
    </div>
  );
}
