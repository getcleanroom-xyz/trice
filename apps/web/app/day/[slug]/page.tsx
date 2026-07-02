import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { days, quizQuestions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { validateMagicLink } from "@/lib/auth/magic-link";
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

  // Filed away for good once expired — the whole point of the mechanic —
  // even for someone holding a technically-valid link.
  if (day.expiresAt.getTime() < Date.now()) notFound();

  if (!token) redirect("/sign-in");
  const session = await validateMagicLink(token);
  if (!session || session.dayId !== day.id) redirect("/sign-in");

  const questions = await db.query.quizQuestions.findMany({
    where: eq(quizQuestions.dayId, day.id),
    orderBy: quizQuestions.sortOrder,
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-serif text-lg italic">Trice</span>
        <StampBadge expiresAt={day.expiresAt} />
      </div>
      <p className="mb-6 font-mono text-[11px] text-muted-foreground">
        day {day.dayNumber}
      </p>

      <DailyContent
        title={day.title}
        videoUrl={day.videoUrl}
        notes={day.notes}
        intro={day.intro}
        objectives={day.objectives}
        summary={day.summary}
        subscriberId={session.subscriber.id}
        dayId={day.id}
        questions={questions.map((q) => ({
          id: q.id,
          prompt: q.prompt,
          choices: q.choices,
        }))}
      />
    </main>
  );
}

