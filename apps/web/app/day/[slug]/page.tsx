import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { db } from "@/lib/db/client";
import { days, quizQuestions, quizTasks, quizAttempts, subscribers as subsTable } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { validateMagicLink } from "@/lib/auth/magic-link";
import { verifyAdminSessionCookie, ADMIN_COOKIE_NAME } from "@/lib/admin/session";
import { StampBadge } from "@/components/stamp-badge";
import { DailyContent } from "@/components/daily-content";

export default async function DayPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { slug } = await params;
  const { token } = await searchParams;

  const day = await db.query.days.findFirst({ where: eq(days.slug, slug) });
  if (!day) notFound();

  if (day.expiresAt.getTime() < Date.now()) notFound();

  const cookieStore = await cookies();
  const isAdmin = verifyAdminSessionCookie(cookieStore.get(ADMIN_COOKIE_NAME)?.value);

  let subscriberId: string;
  if (isAdmin) {
    subscriberId = "admin";
  } else {
    if (!token) redirect("/sign-in");
    const session = await validateMagicLink(token);
    if (!session || session.dayId !== day.id) redirect("/sign-in");
    subscriberId = session.subscriber.id;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sub = session.subscriber;
    const lastVisit = sub.lastVisitAt
      ? new Date(sub.lastVisitAt.getFullYear(), sub.lastVisitAt.getMonth(), sub.lastVisitAt.getDate())
      : null;

    let cur = sub.currentStreak;
    if (!lastVisit) {
      cur = 1;
    } else {
      const diff = Math.round((today.getTime() - lastVisit.getTime()) / 86400000);
      if (diff === 1) cur += 1;
      else if (diff > 1) cur = 1;
    }

    await db.update(subsTable).set({
      currentStreak: cur,
      longestStreak: Math.max(cur, sub.longestStreak),
      lastVisitAt: now,
    }).where(eq(subsTable.id, sub.id));
  }

  const questions = await db.query.quizQuestions.findMany({
    where: eq(quizQuestions.dayId, day.id),
    orderBy: quizQuestions.sortOrder,
  });

  const quizTask = await db.query.quizTasks.findFirst({
    where: eq(quizTasks.dayId, day.id),
  });

  const existingAttempt = subscriberId !== "admin"
    ? await db.query.quizAttempts.findFirst({
        where: and(
          eq(quizAttempts.subscriberId, subscriberId),
          eq(quizAttempts.dayId, day.id),
        ),
      })
    : null;

  let existingResult: {
    score: number;
    total: number;
    results: { prompt: string; choices: string[]; correctIndex: number; chosenIndex: number; correct: boolean }[];
    taskGrade?: string | null;
  } | null = null;

  if (existingAttempt) {
    const results = questions.map((q, i) => ({
      prompt: q.prompt,
      choices: q.choices,
      correctIndex: q.correctIndex,
      chosenIndex: existingAttempt.answers[i] ?? -1,
      correct: existingAttempt.answers[i] === q.correctIndex,
    }));
    const score = results.filter((r) => r.correct).length;
    existingResult = { score, total: questions.length, results, taskGrade: existingAttempt.taskGrade };
  }

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-16 sm:pb-24">
      <header className="mb-4 flex items-center justify-between">
        <Link href="/" className="font-serif text-lg italic text-foreground hover:text-primary transition-colors">Trice</Link>
        <StampBadge publishAt={day.publishAt} expiresAt={day.expiresAt} />
      </header>
      <p className="mb-4 font-mono text-[11px] text-muted-foreground">
        day {day.dayNumber}
        {isAdmin && <span className="ml-2 text-primary font-medium">(admin preview)</span>}
      </p>

      <DailyContent
        title={day.title}
        videoUrls={day.videoUrls}
        videoDurations={(day.videoDurations as number[]) ?? []}
        notes={day.notes}
        intro={day.intro}
        objectives={day.objectives}
        summary={day.summary}
        subscriberId={subscriberId}
        dayId={day.id}
        questions={questions.map((q) => ({
          id: q.id,
          prompt: q.prompt,
          choices: q.choices,
        }))}
        task={quizTask?.prompt}
        existingResult={existingResult}
      />
    </main>
  );
}

