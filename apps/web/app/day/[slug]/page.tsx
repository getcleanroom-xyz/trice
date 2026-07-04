import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { db } from "@/lib/db/client";
import { days, quizQuestions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
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
  }

  const questions = await db.query.quizQuestions.findMany({
    where: eq(quizQuestions.dayId, day.id),
    orderBy: quizQuestions.sortOrder,
  });

  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <header className="mb-4 flex items-center justify-between">
        <Link href="/" className="font-serif text-lg italic text-foreground hover:text-primary transition-colors">Trice</Link>
        <StampBadge expiresAt={day.expiresAt} />
      </header>
      <p className="mb-4 font-mono text-[11px] text-muted-foreground">
        day {day.dayNumber}
        {isAdmin && <span className="ml-2 text-primary font-medium">(admin preview)</span>}
      </p>

      <DailyContent
        title={day.title}
        videoUrls={day.videoUrls}
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
      />
    </main>
  );
}

