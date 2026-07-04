"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { submitQuiz } from "@/app/actions/submit-quiz";
import { Button } from "@/components/ui/button";

type Question = { id: string; prompt: string; choices: string[] };

export function ClosingPage({
  subscriberId,
  dayId,
  questions,
}: {
  subscriberId: string;
  dayId: string;
  questions: Question[];
}) {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);
  const [pending, startTransition] = useTransition();

  if (result) {
    return (
      <div className="h-full rounded-sm border border-border bg-card p-6 text-center overflow-hidden">
        <Check aria-hidden className="mx-auto mb-3 h-5 w-5 text-primary" />
        <p className="font-serif text-base text-foreground">
          {result.score} of {result.total} — see you tomorrow.
        </p>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="h-full rounded-sm border border-border bg-card p-6 text-center overflow-hidden">
        <p className="mb-2 font-mono text-[10px] tracking-wide text-primary">
          the closing page
        </p>
        <p className="mb-4 font-serif text-base text-foreground">
          {questions.length} questions. Five minutes.
        </p>
        <Button onClick={() => setStarted(true)}>Begin</Button>
      </div>
    );
  }

  const question = questions[step];

  function choose(index: number) {
    const next = [...answers];
    next[step] = index;
    setAnswers(next);

    if (step < questions.length - 1) {
      setStep(step + 1);
      return;
    }

    startTransition(async () => {
      const outcome = await submitQuiz(subscriberId, dayId, next);
      setResult(outcome);
    });
  }

  return (
    <div className="h-full rounded-sm border border-border bg-card p-6 overflow-hidden">
      <div className="mb-5 flex justify-center gap-1.5">
        {questions.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              i <= step ? "bg-primary" : "bg-secondary",
            )}
          />
        ))}
      </div>
      <p className="mb-4 text-center font-serif text-base text-foreground">
        {question.prompt}
      </p>
      <div className="flex flex-col gap-2">
        {question.choices.map((choice, i) => (
          <button
            key={i}
            disabled={pending}
            onClick={() => choose(i)}
            className="rounded-sm border border-border px-4 py-2.5 text-left text-sm text-foreground hover:border-primary disabled:opacity-50"
          >
            {choice}
          </button>
        ))}
      </div>
    </div>
  );
}
