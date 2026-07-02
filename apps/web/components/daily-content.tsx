"use client";

import { DayLayout } from "@/components/day-layout";
import { VideoPanel } from "@/components/video-panel";
import { NoteCard } from "@/components/note-card";
import { InfoTabs } from "@/components/info-tabs";
import { ClosingPage } from "@/components/closing-page";

type Question = { id: string; prompt: string; choices: string[] };

export function DailyContent({
  title,
  videoUrl,
  notes,
  intro,
  objectives,
  summary,
  subscriberId,
  dayId,
  questions,
}: {
  title: string;
  videoUrl: string;
  notes: string;
  intro: string;
  objectives: string[];
  summary: string;
  subscriberId: string;
  dayId: string;
  questions: Question[];
}) {
  return (
    <DayLayout
      panels={{
        video: <VideoPanel title={title} videoUrl={videoUrl} />,
        notes: <NoteCard notes={notes} />,
        tabs: <InfoTabs intro={intro} objectives={objectives} summary={summary} />,
        quiz: (
          <ClosingPage subscriberId={subscriberId} dayId={dayId} questions={questions} />
        ),
      }}
    />
  );
}
