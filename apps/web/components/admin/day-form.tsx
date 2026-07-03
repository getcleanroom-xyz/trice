"use client";

import { useState, useTransition } from "react";
import { X, Plus } from "lucide-react";
import { createDay, type CreateDayInput } from "@/app/admin/content-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Question = { prompt: string; choices: string[]; correctIndex: number };

const textareaClass =
  "rounded-sm border border-input bg-transparent px-3.5 py-2 text-sm text-foreground";
const labelClass = "font-mono text-[10px] text-muted-foreground";

export function DayForm({ topics }: { topics: { id: string; title: string }[] }) {
  const [topicId, setTopicId] = useState(topics[0]?.id ?? "");
  const [dayNumber, setDayNumber] = useState(1);
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [intro, setIntro] = useState("");
  const [objectives, setObjectives] = useState<string[]>([""]);
  const [summary, setSummary] = useState("");
  const [notes, setNotes] = useState("");
  const [publishAt, setPublishAt] = useState("");
  const [graceHours, setGraceHours] = useState(24);
  const [task, setTask] = useState("");
  const [questions, setQuestions] = useState<Question[]>([
    { prompt: "", choices: ["", ""], correctIndex: 0 },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function updateQuestion(i: number, patch: Partial<Question>) {
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  }

  function submit() {
    setError(null);
    const input: CreateDayInput = {
      topicId,
      dayNumber,
      slug,
      title,
      videoUrl,
      intro,
      objectives: objectives.filter(Boolean),
      summary,
      notes,
      publishAt: new Date(publishAt).toISOString(),
      graceHours,
      questions: questions
        .filter((q) => q.prompt && q.choices.filter(Boolean).length >= 2)
        .map((q) => ({ ...q, choices: q.choices.filter(Boolean) })),
      task: task || undefined,
    };
    startTransition(async () => {
      try {
        await createDay(input);
      } catch (e) {
        // `redirect()` inside the server action throws a special Next.js
        // control-flow error (digest starts with NEXT_REDIRECT) that must
        // propagate, not be swallowed as a form error.
        if (e && typeof e === "object" && "digest" in e && String(e.digest).startsWith("NEXT_REDIRECT")) {
          throw e;
        }
        setError(e instanceof Error ? e.message : "Something went wrong saving this day.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>topic</span>
          <select
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            className={textareaClass}
          >
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>day number</span>
          <Input
            type="number"
            value={dayNumber}
            onChange={(e) => setDayNumber(Number(e.target.value))}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>slug (used in the URL)</span>
        <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="binary-search-revisited" />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>title</span>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>video URL</span>
        <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>intro</span>
        <textarea value={intro} onChange={(e) => setIntro(e.target.value)} rows={2} className={textareaClass} />
      </label>

      <div className="flex flex-col gap-1.5">
        <span className={labelClass}>objectives</span>
        {objectives.map((o, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={o}
              onChange={(e) =>
                setObjectives((os) => os.map((x, idx) => (idx === i ? e.target.value : x)))
              }
            />
            <button
              type="button"
              onClick={() => setObjectives((os) => os.filter((_, idx) => idx !== i))}
              className="text-muted-foreground"
              aria-label="Remove objective"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setObjectives((os) => [...os, ""])}
          className="flex items-center gap-1 self-start font-mono text-[11px] text-primary"
        >
          <Plus className="h-3 w-3" /> add objective
        </button>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>summary</span>
        <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} className={textareaClass} />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>your notes</span>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={textareaClass} />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>publishes at</span>
          <Input
            type="datetime-local"
            value={publishAt}
            onChange={(e) => setPublishAt(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>grace period (hours)</span>
          <Input
            type="number"
            value={graceHours}
            onChange={(e) => setGraceHours(Number(e.target.value))}
          />
        </label>
      </div>

      <div className="flex flex-col gap-3 rounded-sm border border-border p-4">
        <span className={labelClass}>closing-page quiz</span>
        {questions.map((q, qi) => (
          <div key={qi} className="rounded-sm border border-border p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[10px] text-muted-foreground">
                question {qi + 1}
              </span>
              <button
                type="button"
                onClick={() => setQuestions((qs) => qs.filter((_, i) => i !== qi))}
                className="text-muted-foreground"
                aria-label="Remove question"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <Input
              className="mb-2"
              value={q.prompt}
              placeholder="Prompt"
              onChange={(e) => updateQuestion(qi, { prompt: e.target.value })}
            />
            {q.choices.map((c, ci) => (
              <div key={ci} className="mb-1.5 flex items-center gap-2">
                <input
                  type="radio"
                  name={`correct-${qi}`}
                  checked={q.correctIndex === ci}
                  onChange={() => updateQuestion(qi, { correctIndex: ci })}
                  aria-label={`Choice ${ci + 1} is correct`}
                />
                <Input
                  value={c}
                  placeholder={`Choice ${ci + 1}`}
                  onChange={(e) =>
                    updateQuestion(qi, {
                      choices: q.choices.map((x, i) => (i === ci ? e.target.value : x)),
                    })
                  }
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => updateQuestion(qi, { choices: [...q.choices, ""] })}
              className="flex items-center gap-1 font-mono text-[11px] text-primary"
            >
              <Plus className="h-3 w-3" /> add choice
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            setQuestions((qs) => [...qs, { prompt: "", choices: ["", ""], correctIndex: 0 }])
          }
          className="flex items-center gap-1 self-start font-mono text-[11px] text-primary"
        >
          <Plus className="h-3 w-3" /> add question
        </button>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>optional hand-graded task</span>
        <textarea value={task} onChange={(e) => setTask(e.target.value)} rows={2} className={textareaClass} />
      </label>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <Button
        disabled={
          pending ||
          !topicId ||
          !slug ||
          !title ||
          !videoUrl ||
          !intro ||
          objectives.filter(Boolean).length === 0 ||
          !summary ||
          !notes ||
          !publishAt ||
          questions.filter((q) => q.prompt && q.choices.filter(Boolean).length >= 2).length === 0
        }
        onClick={submit}
        className={cn("self-start")}
      >
        {pending ? "Publishing…" : "Publish day"}
      </Button>
    </div>
  );
}
