"use client";

import { Button } from "@/components/ui/button";

function CompletionCard({ onStartQuiz, quizStarted }: { onStartQuiz: () => void; quizStarted: boolean }) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-6 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
        <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="mb-2 font-serif text-xl text-foreground">Learning goal hit!</h2>
      <p className="mb-1 text-sm text-muted-foreground">10 minutes of focused learning — well done.</p>
      <p className="mb-5 text-xs text-muted-foreground/60">Your progress has been saved.</p>
      {!quizStarted && (
        <Button onClick={onStartQuiz} size="sm">Start quiz</Button>
      )}
      {quizStarted && (
        <p className="text-xs text-muted-foreground">Quiz in progress →</p>
      )}
    </div>
  );
}

export { CompletionCard };
