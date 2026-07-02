import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

const steps = [
  {
    n: "01",
    title: "The link arrives",
    body: "One email, every morning. It's your only way in — no account to log into.",
  },
  {
    n: "02",
    title: "Watch, ten minutes",
    body: "A clipped video on one specific idea, with the intro, objectives, and summary alongside it if you want more context.",
  },
  {
    n: "03",
    title: "Read the notes",
    body: "What I actually took away from learning it myself, written plainly, pinned right next to the video.",
  },
  {
    n: "04",
    title: "Prove it, five minutes",
    body: "A short quiz graded instantly, or a small task graded by hand later.",
  },
  {
    n: "05",
    title: "It closes at midnight",
    body: "Miss a day and it's filed away for good — but tomorrow's card still comes. No backlog to dread.",
  },
];

export default function HowItWorksPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-14">
      <span className="mb-11 block font-serif text-lg italic">Trice</span>
      <h1 className="mb-1 font-serif text-3xl text-foreground">
        How the fifteen minutes work
      </h1>
      <p className="mb-2 max-w-md text-sm text-muted-foreground">
        Five steps, every weekday morning. No app, no password, no backlog.
      </p>

      {steps.map((s) => (
        <div key={s.n} className="flex gap-5 border-t border-border py-6">
          <span className="w-8 font-mono text-xl text-primary">{s.n}</span>
          <div>
            <h2 className="mb-1.5 font-serif text-base text-foreground">{s.title}</h2>
            <p className="max-w-md text-[13px] leading-relaxed text-muted-foreground">
              {s.body}
            </p>
          </div>
        </div>
      ))}

      <Link href="/" className={buttonVariants({ className: "mt-9" })}>
        Join the roll
      </Link>
    </main>
  );
}
