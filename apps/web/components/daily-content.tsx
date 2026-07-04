"use client";

import { useEffect, useState } from "react";
import { DayLayout } from "@/components/day-layout";
import { VideoPanel } from "@/components/video-panel";
import { NoteCard } from "@/components/note-card";
import { InfoTabs } from "@/components/info-tabs";
import { ClosingPage } from "@/components/closing-page";
import { CompletionCard } from "@/components/completion-card";
import { Confetti } from "@/components/ui/confetti";
import { useVideoTracker } from "@/hooks/use-video-tracker";

type Question = { id: string; prompt: string; choices: string[] };

const TOTAL_GOAL_SECONDS = 600;

export function DailyContent({
  title,
  videoUrls,
  videoDurations,
  notes,
  intro,
  objectives,
  summary,
  subscriberId,
  dayId,
  questions,
}: {
  title: string;
  videoUrls: string[];
  videoDurations: number[];
  notes: string;
  intro: string;
  objectives: string[];
  summary: string;
  subscriberId: string;
  dayId: string;
  questions: Question[];
}) {
  const [showQuiz, setShowQuiz] = useState(false);
  const [learningGoalMet, setLearningGoalMet] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [totalTarget, setTotalTarget] = useState(TOTAL_GOAL_SECONDS);

  useEffect(() => {
    if (videoDurations.length > 0) {
      setTotalTarget(videoDurations.reduce((sum, d) => sum + d * 60, 0));
    }
  }, [videoDurations]);

  useEffect(() => {
    fetch(`/api/progress?dayId=${dayId}&subscriberId=${subscriberId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.completedAt) {
          setLearningGoalMet(true);
        }
      })
      .catch(() => {});
  }, [dayId, subscriberId]);

  const { registerVideo, completed, watchSeconds } = useVideoTracker({
    subscriberId,
    dayId,
    targetSeconds: totalTarget,
    onComplete: () => {
      setLearningGoalMet(true);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3500);
    },
  });

  const videoPanel = learningGoalMet ? (
    <CompletionCard onStartQuiz={() => setShowQuiz(true)} />
  ) : (
    <VideoPanel title={title} videoUrls={videoUrls} />
  );

  return (
    <DayLayout
      panels={{
        video: (
          <div className="relative h-full">
            {videoPanel}
            {showConfetti && <Confetti duration={3500} />}
          </div>
        ),
        notes: <NoteCard notes={notes} />,
        tabs: <InfoTabs intro={intro} objectives={objectives} summary={summary} />,
        quiz: (
          showQuiz || learningGoalMet ? (
            <ClosingPage subscriberId={subscriberId} dayId={dayId} questions={questions} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-6 text-center">
              <p className="mb-1 font-mono text-[10px] tracking-widest text-primary/70 uppercase">
                the closing page
              </p>
              <p className="mb-5 font-serif text-lg text-foreground">
                {questions.length} question{questions.length !== 1 && "s"}. Five minutes.
              </p>
              {!learningGoalMet && (
                <p className="text-xs text-muted-foreground">Complete the learning goal to unlock the quiz.</p>
              )}
              {learningGoalMet && (
                <button
                  onClick={() => setShowQuiz(true)}
                  className="mt-2 rounded-lg border border-primary px-5 py-2.5 text-sm font-mono text-foreground hover:bg-primary/10 transition-colors"
                >
                  Begin quiz
                </button>
              )}
            </div>
          )
        ),
      }}
    />
  );
}
