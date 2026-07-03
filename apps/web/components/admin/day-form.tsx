"use client";

import { useState, useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Plus } from "lucide-react";
import { createDay } from "@/app/admin/content-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Radio } from "@/components/ui/radio";
import { cn } from "@/lib/utils";

const questionSchema = z.object({
  prompt: z.string().min(1),
  choices: z.array(z.string().min(1)).min(2),
  correctIndex: z.number().int().min(0),
});

const formSchema = z.object({
  topicId: z.string().uuid(),
  dayNumber: z.number().int().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "lowercase letters, numbers, hyphens only"),
  title: z.string().min(1),
  videoUrl: z.string().url(),
  intro: z.string().min(1),
  objectives: z.array(z.string().min(1)).min(1),
  summary: z.string().min(1),
  notes: z.string().min(1),
  publishAt: z.string().min(1),
  graceHours: z.number().min(1).max(72),
  questions: z.array(questionSchema).min(1),
  task: z.string().optional(),
});

interface FormValues {
  topicId: string;
  dayNumber: number;
  slug: string;
  title: string;
  videoUrl: string;
  intro: string;
  objectives: string[];
  summary: string;
  notes: string;
  publishAt: string;
  graceHours: number;
  questions: { prompt: string; choices: string[]; correctIndex: number }[];
  task?: string;
}

export function DayForm({ topics }: { topics: { id: string; title: string }[] }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topicId: topics[0]?.id ?? "",
      dayNumber: 1,
      slug: "",
      title: "",
      videoUrl: "",
      intro: "",
      objectives: [""],
      summary: "",
      notes: "",
      publishAt: "",
      graceHours: 24,
      questions: [{ prompt: "", choices: ["", ""], correctIndex: 0 }],
      task: "",
    },
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = form;

  const objectivesArray = useFieldArray<FormValues, "objectives">({ control, name: "objectives" });
  const questionsArray = useFieldArray<FormValues, "questions">({ control, name: "questions" });

  function onSubmit(values: FormValues) {
    setServerError(null);
    startTransition(async () => {
      try {
        await createDay(values);
      } catch (e) {
        if (e && typeof e === "object" && "digest" in e && String(e.digest).startsWith("NEXT_REDIRECT")) {
          throw e;
        }
        setServerError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  }

  const fieldErrorClass = "text-xs text-destructive";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="topicId">topic</Label>
          <Select {...register("topicId")}>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </Select>
          {errors.topicId && <p className={fieldErrorClass}>{errors.topicId.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dayNumber">day number</Label>
          <Input type="number" {...register("dayNumber", { valueAsNumber: true })} />
          {errors.dayNumber && <p className={fieldErrorClass}>{errors.dayNumber.message}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="slug">slug (used in the URL)</Label>
        <Input {...register("slug")} placeholder="binary-search-revisited" />
        {errors.slug && <p className={fieldErrorClass}>{errors.slug.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">title</Label>
        <Input {...register("title")} />
        {errors.title && <p className={fieldErrorClass}>{errors.title.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="videoUrl">video URL</Label>
        <Input {...register("videoUrl")} placeholder="https://youtube.com/watch?v=..." />
        {errors.videoUrl && <p className={fieldErrorClass}>{errors.videoUrl.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="intro">intro</Label>
        <Textarea {...register("intro")} rows={2} />
        {errors.intro && <p className={fieldErrorClass}>{errors.intro.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>objectives</Label>
        {objectivesArray.fields.map((field, i) => (
          <div key={field.id} className="flex gap-2">
            <Input {...register(`objectives.${i}`)} />
            <button
              type="button"
              onClick={() => objectivesArray.remove(i)}
              className="text-muted-foreground"
              aria-label="Remove objective"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        {errors.objectives && (
          <p className={fieldErrorClass}>{errors.objectives.message}</p>
        )}
        <button
          type="button"
          onClick={() => objectivesArray.append("")}
          className="flex items-center gap-1 self-start font-mono text-[11px] text-primary"
        >
          <Plus className="h-3 w-3" /> add objective
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="summary">summary</Label>
        <Textarea {...register("summary")} rows={2} />
        {errors.summary && <p className={fieldErrorClass}>{errors.summary.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">your notes</Label>
        <Textarea {...register("notes")} rows={3} />
        {errors.notes && <p className={fieldErrorClass}>{errors.notes.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="publishAt">publishes at</Label>
          <Input type="datetime-local" {...register("publishAt")} />
          {errors.publishAt && <p className={fieldErrorClass}>{errors.publishAt.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="graceHours">grace period (hours)</Label>
          <Input type="number" {...register("graceHours", { valueAsNumber: true })} />
          {errors.graceHours && <p className={fieldErrorClass}>{errors.graceHours.message}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-sm border border-border p-4">
        <Label>closing-page quiz</Label>
        {questionsArray.fields.map((field, qi) => (
          <div key={field.id} className="rounded-sm border border-border p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[10px] text-muted-foreground">question {qi + 1}</span>
              <button
                type="button"
                onClick={() => questionsArray.remove(qi)}
                className="text-muted-foreground"
                aria-label="Remove question"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <Input
              className="mb-2"
              {...register(`questions.${qi}.prompt`)}
              placeholder="Prompt"
            />
            {errors.questions?.[qi]?.prompt && (
              <p className={cn(fieldErrorClass, "mb-1")}>{errors.questions[qi].prompt.message}</p>
            )}
            {field.choices.map((_, ci) => (
              <div key={ci} className="mb-1.5 flex items-center gap-2">
                <Radio
                  {...register(`questions.${qi}.correctIndex`, { valueAsNumber: true })}
                  value={ci}
                  defaultChecked={field.correctIndex === ci}
                  aria-label={`Choice ${ci + 1} is correct`}
                />
                <Input
                  {...register(`questions.${qi}.choices.${ci}`)}
                  placeholder={`Choice ${ci + 1}`}
                />
              </div>
            ))}
            {errors.questions?.[qi]?.choices && (
              <p className={fieldErrorClass}>{errors.questions[qi].choices.message}</p>
            )}
            <button
              type="button"
              onClick={() =>
                questionsArray.update(qi, {
                  ...field,
                  choices: [...field.choices, ""],
                })
              }
              className="flex items-center gap-1 font-mono text-[11px] text-primary"
            >
              <Plus className="h-3 w-3" /> add choice
            </button>
          </div>
        ))}
        {errors.questions && !Array.isArray(errors.questions) && (
          <p className={fieldErrorClass}>{errors.questions.message}</p>
        )}
        <button
          type="button"
          onClick={() =>
            questionsArray.append({ prompt: "", choices: ["", ""], correctIndex: 0 })
          }
          className="flex items-center gap-1 self-start font-mono text-[11px] text-primary"
        >
          <Plus className="h-3 w-3" /> add question
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="task">optional hand-graded task</Label>
        <Textarea {...register("task")} rows={2} />
      </div>

      {serverError && <p className={fieldErrorClass}>{serverError}</p>}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Publishing…" : "Publish day"}
      </Button>
    </form>
  );
}
