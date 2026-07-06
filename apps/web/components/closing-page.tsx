"use client";

import { useState, useTransition } from "react";
import { Check, X, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { submitQuiz } from "@/app/actions/submit-quiz";
import { Button } from "@/components/ui/button";
import { DragHandle } from "@/components/panel-handles";
import { Markdown } from "@/components/ui/markdown";

type Question = { id: string; prompt: string; choices: string[] };
type ResultItem = { prompt: string; choices: string[]; correctIndex: number; chosenIndex: number; correct: boolean };

export function ClosingPage({
  subscriberId,
  dayId,
  questions,
  task,
}: {
  subscriberId: string;
  dayId: string;
  questions: Question[];
  task?: string;
}) {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [taskSubmission, setTaskSubmission] = useState("");
  const [result, setResult] = useState<{ score: number; total: number; results: ResultItem[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const hasTask = !!task;
  const totalSteps = questions.length + (hasTask ? 1 : 0);
  const taskStep = questions.length;
  const estimatedMinutes = Math.max(1, Math.ceil((questions.length * 30 + (hasTask ? 120 : 0)) / 60));

  if (questions.length === 0 && !hasTask) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <DragHandle />
        <p className="font-serif text-lg text-foreground">
          No quiz available for this lesson yet.
        </p>
      </div>
    );
  }

  if (result) {
    const missed = result.results.filter((r) => !r.correct);
    return (
      <div className="flex flex-col h-full p-5">
        <DragHandle />
        <div className="flex items-center justify-center gap-3 mb-4">
          <Check aria-hidden className="h-5 w-5 text-primary" />
          <p className="font-serif text-lg text-foreground">
            {result.score} of {result.total}
          </p>
        </div>
        {missed.length > 0 ? (
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
            <p className="mb-3 text-xs text-muted-foreground">
              Review the ones you missed:
            </p>
            <div className="flex flex-col gap-4">
              {missed.map((r, i) => (
                <div key={i} className="rounded-lg border border-border p-4">
                  <p className="mb-3 font-serif text-sm text-foreground leading-snug">{r.prompt}</p>
                  <div className="flex flex-col gap-1.5">
                    {r.choices.map((choice, ci) => {
                      const isChosen = ci === r.chosenIndex;
                      const isCorrect = ci === r.correctIndex;
                      return (
                        <div
                          key={ci}
                          className={cn(
                            "flex items-center gap-2 rounded-md px-3 py-2 text-xs",
                            isCorrect && "bg-primary/15 text-primary",
                            isChosen && !isCorrect && "bg-destructive/15 text-destructive",
                            !isCorrect && !isChosen && "text-muted-foreground",
                          )}
                        >
                          {isCorrect && <Check className="h-3 w-3 shrink-0" />}
                          {isChosen && !isCorrect && <X className="h-3 w-3 shrink-0" />}
                          <span>{choice}</span>
                          {isCorrect && <span className="ml-auto font-mono text-[10px] opacity-60">correct</span>}
                          {isChosen && !isCorrect && <span className="ml-auto font-mono text-[10px] opacity-60">your answer</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground">Perfect score — see you tomorrow.</p>
        )}
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
          {questions.length} question{questions.length !== 1 && "s"}{hasTask && " + 1 task"}. About {estimatedMinutes} minute{estimatedMinutes !== 1 && "s"}.
        </p>
        <Button onClick={() => setStarted(true)} variant="secondary">Begin</Button>
      </div>
    );
  }

  function submit(finalAnswers: number[], taskSub: string) {
    startTransition(async () => {
      try {
        const outcome = await submitQuiz(subscriberId, dayId, finalAnswers, taskSub || undefined);
        setResult(outcome);
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  }

  if (hasTask && step === taskStep) {
    return (
      <div className="flex flex-col h-full p-5">
        <div className="flex justify-center gap-1.5 mb-4">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 w-1.5 rounded-full transition-colors",
                i < step ? "bg-primary/40" : i === step ? "bg-primary" : "bg-secondary",
              )}
            />
          ))}
        </div>
        {error && (
          <p className="mb-3 text-center text-xs text-red-500">{error}</p>
        )}
        <p className="mb-2 text-center font-mono text-[10px] tracking-widest text-primary/70 uppercase">
          task
        </p>
        <div className="mb-4 text-sm text-foreground/80 leading-relaxed">
          <Markdown>{task}</Markdown>
        </div>
        <textarea
          value={taskSubmission}
          onChange={(e) => setTaskSubmission(e.target.value)}
          placeholder="Write your solution here..."
          className="mb-3 w-full flex-1 min-h-[120px] rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setStep(questions.length - 1)} className="px-3">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => submit(answers, taskSubmission)}
            disabled={pending || !taskSubmission.trim()}
            className="flex-1"
          >
            {pending ? "Submitting…" : "Submit solution"}
          </Button>
        </div>
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

    if (hasTask) {
      setStep(taskStep);
      return;
    }

    submit(next, "");
  }

  return (
    <div className="flex flex-col h-full p-5">
      <div className="flex justify-center gap-1.5 mb-4">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 w-1.5 rounded-full transition-colors",
              i < step ? "bg-primary/40" : i === step ? "bg-primary" : "bg-secondary",
            )}
          />
        ))}
      </div>
      {error && (
        <p className="mb-3 text-center text-xs text-red-500">{error}</p>
      )}
      <p className="mb-1 text-center font-mono text-[10px] text-muted-foreground">
        {step + 1} / {questions.length}
      </p>
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
      {step > 0 && (
        <button
          onClick={() => setStep(step - 1)}
          className="mt-3 self-start flex items-center gap-1 font-mono text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-3 w-3" /> back
        </button>
      )}
    </div>
  );
}
