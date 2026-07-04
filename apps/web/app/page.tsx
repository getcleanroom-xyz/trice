import Link from "next/link";
import { db } from "@/lib/db/client";
import { days, topics } from "@/lib/db/schema";
import { and, lte, gte, desc, eq } from "drizzle-orm";
import { SignupForm } from "@/components/signup-form";
import { StampBadge } from "@/components/stamp-badge";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const now = new Date();
  const openDay = await db.query.days.findFirst({
    where: and(lte(days.publishAt, now), gte(days.expiresAt, now)),
    orderBy: desc(days.publishAt),
  });
  const topic = openDay
    ? await db.query.topics.findFirst({ where: eq(topics.id, openDay.topicId) })
    : null;

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-14">
      <nav className="mb-12 sm:mb-16 flex items-center justify-between">
        <Link href="/" className="font-serif text-xl italic">Trice</Link>
        <div className="flex gap-4 sm:gap-6 font-mono text-[11px] text-muted-foreground">
          <Link href="/how-it-works">how it works</Link>
          <Link href="/sign-in">sign in</Link>
        </div>
      </nav>

      <h1 className="mb-3 sm:mb-4 max-w-lg font-serif text-3xl sm:text-4xl leading-tight text-foreground">
        Fifteen minutes,
        <br />
        <em className="text-primary not-italic">spent well.</em>
      </h1>
      <p className="mb-6 sm:mb-7 max-w-md text-sm sm:text-[15px] leading-relaxed text-muted-foreground">
        One concept a day. Engineering, leadership, and the business sense that makes
        both worth doing. Ten minutes to learn it, five to prove you did.
      </p>
      <SignupForm />

      {openDay && topic && (
        <section className="mt-12 sm:mt-16 border-t border-border pt-6 sm:pt-8">
          <p className="mb-1 font-mono text-[11px] text-primary">
            this week&rsquo;s chapter
          </p>
          <h2 className="mb-5 sm:mb-7 font-serif text-xl sm:text-2xl text-foreground">{topic.title}</h2>
          <div className="flex flex-col sm:flex-row gap-5 sm:gap-7">
            <div className="w-full sm:w-70 shrink-0 -rotate-1 rounded-sm border border-border bg-secondary p-4">
              <StampBadge publishAt={openDay.publishAt} expiresAt={openDay.expiresAt} className="mb-3" />
              <div className="mb-3 aspect-video rounded-sm bg-background" />
              <p className="mb-1 font-mono text-[10px] text-muted-foreground">
                day {openDay.dayNumber}
              </p>
              <h3 className="mb-2 font-serif text-base text-foreground">
                {openDay.title}
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {openDay.intro}
              </p>
            </div>
            <p className="flex-1 pt-0 sm:pt-2 text-[13px] leading-relaxed text-muted-foreground">
              {topic.description}
            </p>
          </div>
        </section>
      )}

      <footer className="mt-12 sm:mt-16 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t border-border pt-5">
        <p className="font-mono text-[10px] text-muted-foreground">
          no ads, no tracking — just a letter each morning
        </p>
        <Link href="/tip" className="font-mono text-[10px] text-primary">
          leave a tip →
        </Link>
      </footer>
    </main>
  );
}
