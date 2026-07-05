import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db/client";
import { insightTokens, quizQuestions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getWeeklyInsights, type WeekInsights } from "@/lib/insights/weekly";
import { Check, X, Minus } from "lucide-react";

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
}

function formatWeekRange(start: Date, end: Date): string {
  return `${formatDate(start)} – ${formatDate(new Date(end.getTime() - 86400000))}`;
}

function Observation({ insights }: { insights: WeekInsights }) {
  const { totals, days } = insights;
  const missed = days.filter((d) => !d.watched && d.quizScore === null);
  const perfect = days.filter((d) => d.quizScore !== null && d.quizTotal > 0 && d.quizScore === d.quizTotal);

  if (totals.daysShownUp === 0) {
    return (
      <p className="text-sm leading-relaxed text-foreground/70">
        The card came every morning this week, but none of them were opened.
        That&rsquo;s alright &mdash; tomorrow&rsquo;s still on its way.
      </p>
    );
  }

  if (totals.daysShownUp === totals.daysAvailable && totals.averageScore === 100) {
    return (
      <p className="text-sm leading-relaxed text-foreground/70">
        Every card. Every quiz. Every answer correct. There&rsquo;s not much
        to say except &mdash; well done. See you next week.
      </p>
    );
  }

  return (
    <div className="space-y-3 text-sm leading-relaxed text-foreground/70">
      <p>
        You showed up {totals.daysShownUp} out of {totals.daysAvailable} day{totals.daysAvailable !== 1 && "s"} this
        week. {totals.daysShownUp === totals.daysAvailable
          ? "That&rsquo;s every single one."
          : missed.length > 0
            ? `${missed.length} card${missed.length !== 1 ? "s" : ""} went untouched.`
            : ""}
      </p>
      {totals.totalQuizQuestions > 0 && (
        <p>
          Across {totals.daysShownUp} quiz{totals.daysShownUp !== 1 ? "zes" : ""}, you got{" "}
          {totals.totalQuizCorrect} out of {totals.totalQuizQuestions} correct
          {totals.averageScore >= 80
            ? " — solid work."
            : totals.averageScore >= 50
              ? " — room to grow, but you&rsquo;re getting there."
              : " — worth revisiting the notes next time."}
        </p>
      )}
      {perfect.length > 0 && (
        <p>
          Perfect scores on: {perfect.map((d) => d.title).join(", ")}.
        </p>
      )}
      {totals.totalWatchMinutes > 0 && (
        <p>
          That&rsquo;s {totals.totalWatchMinutes} minute{totals.totalWatchMinutes !== 1 ? "s" : ""} of
          focused learning. Not a small thing.
        </p>
      )}
    </div>
  );
}

export default async function InsightsPage({
  params,
  searchParams,
}: {
  params: Promise<{ week: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { week } = await params;
  const { token } = await searchParams;

  if (!token) notFound();

  const insightToken = await db.query.insightTokens.findFirst({
    where: eq(insightTokens.token, token),
  });
  if (!insightToken) notFound();
  if (insightToken.expiresAt.getTime() < Date.now()) notFound();

  const weekStart = new Date(week);
  if (isNaN(weekStart.getTime())) notFound();

  const insights = await getWeeklyInsights(insightToken.subscriberId, weekStart);

  const allQuestionIds = insights.days.flatMap((d) => d.id);
  const allQuestions =
    allQuestionIds.length > 0
      ? await db.query.quizQuestions.findMany()
      : [];
  const questionsByDay = new Map<string, typeof allQuestions>();
  for (const q of allQuestions) {
    if (!questionsByDay.has(q.dayId)) questionsByDay.set(q.dayId, []);
    questionsByDay.get(q.dayId)!.push(q);
  }

  return (
    <main className="mx-auto max-w-2xl px-4 sm:px-6 py-10 sm:py-14">
      <nav className="mb-10 sm:mb-14 flex items-center justify-between">
        <Link href="/" className="font-serif text-lg italic text-foreground hover:text-primary transition-colors">
          Trice
        </Link>
      </nav>

      <header className="mb-10">
        <p className="mb-2 font-mono text-[10px] tracking-widest text-primary/70 uppercase">
          week in review
        </p>
        <h1 className="mb-2 font-serif text-2xl sm:text-3xl text-foreground leading-tight">
          {formatWeekRange(insights.weekStart, insights.weekEnd)}
        </h1>
        <p className="font-mono text-[11px] text-muted-foreground">
          {insights.totals.daysShownUp} of {insights.totals.daysAvailable} days
        </p>
      </header>

      <section className="mb-12">
        <Observation insights={insights} />
      </section>

      <section className="mb-12">
        <h2 className="mb-5 font-mono text-[10px] tracking-widest text-primary/70 uppercase">
          the days
        </h2>
        <div className="flex flex-col gap-4">
          {insights.days.map((day) => (
            <div
              key={day.id}
              className="rounded-lg border border-border p-5 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="mb-0.5 font-mono text-[10px] text-muted-foreground">
                    day {day.dayNumber} &middot; {formatDate(day.publishAt)}
                  </p>
                  <h3 className="font-serif text-base text-foreground leading-snug">
                    {day.title}
                  </h3>
                </div>
                <div className="shrink-0 flex items-center gap-1.5">
                  {day.watched && (
                    <span className="inline-flex items-center gap-1 rounded-sm bg-primary/15 px-2 py-0.5 font-mono text-[9px] text-primary">
                      <Check className="h-2.5 w-2.5" /> watched
                    </span>
                  )}
                  {!day.watched && day.quizScore === null && (
                    <span className="inline-flex items-center gap-1 rounded-sm bg-muted px-2 py-0.5 font-mono text-[9px] text-muted-foreground">
                      <Minus className="h-2.5 w-2.5" /> missed
                    </span>
                  )}
                </div>
              </div>

              {day.quizScore !== null && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    {day.quizScore === day.quizTotal ? (
                      <Check className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-destructive" />
                    )}
                    <span className="font-mono text-xs text-foreground">
                      {day.quizScore}/{day.quizTotal}
                    </span>
                  </div>
                  {day.quizTotal > 0 && (
                    <div className="flex-1 h-1 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/60"
                        style={{ width: `${(day.quizScore / day.quizTotal) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              {day.watched && day.watchSeconds > 0 && (
                <p className="font-mono text-[10px] text-muted-foreground">
                  {Math.round(day.watchSeconds / 60)} min watched
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {insights.totals.daysAvailable === 0 && (
        <section className="mb-12 text-center">
          <p className="text-sm text-muted-foreground">
            No cards were published this week.
          </p>
        </section>
      )}

      <footer className="border-t border-border pt-6">
        <p className="font-mono text-[10px] text-muted-foreground">
          your streak: {insights.subscriber.currentStreak} day{insights.subscriber.currentStreak !== 1 ? "s" : ""} &middot;
          {" "}longest: {insights.subscriber.longestStreak} day{insights.subscriber.longestStreak !== 1 ? "s" : ""}
        </p>
      </footer>
    </main>
  );
}
