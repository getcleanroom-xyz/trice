"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { submitQuiz } from "@/app/actions/submit-quiz";
import { Button } from "@/components/ui/button";
import { DragHandle } from "@/components/panel-handles";

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
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <DragHandle />
        <Check aria-hidden className="mb-4 h-6 w-6 text-primary" />
        <p className="font-serif text-lg text-foreground">
          {result.score} of {result.total} — see you tomorrow.
        </p>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <DragHandle />
        <p className="mb-1 font-mono text-[10px] tracking-widest text-primary/70 uppercase">
          the closing page
        </p>
        <p className="mb-5 font-serif text-lg text-foreground">
          {questions.length} question{questions.length !== 1 && "s"}. Five minutes.
        </p>
        <Button onClick={() => setStarted(true)} variant="secondary">Begin</Button>
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
    <div className="flex flex-col h-full p-5">
      <div className="flex justify-center gap-1.5 mb-4">
        {questions.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 w-1.5 rounded-full transition-colors",
              i <= step ? "bg-primary" : "bg-secondary",
            )}
          />
        ))}
      </div>
      <p className="mb-4 text-center font-serif text-base text-foreground leading-snug">
        {question.prompt}
      </p>
      <div className="flex flex-col gap-2 mt-auto">
        {question.choices.map((choice, i) => (
          <button
            key={i}
            disabled={pending}
            onClick={() => choose(i)}
            className="rounded-lg border border-border px-4 py-3 text-left text-sm text-foreground hover:border-primary/60 hover:bg-primary/5 transition-colors disabled:opacity-50"
          >
            {choice}
          </button>
        ))}
      </div>
    </div>
  );
}
