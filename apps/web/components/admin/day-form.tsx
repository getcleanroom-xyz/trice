"use client";

import { useState, useEffect, useTransition, useRef, useCallback } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Plus } from "lucide-react";
import { createDay } from "@/app/admin/content-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioInput } from "@/components/ui/radio";
import { DateTimePicker } from "@/components/ui/datetime-picker";
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
  title: z.string().min(1, "Enter a title"),
  videoUrls: z.array(z.object({ url: z.string().url("Enter a valid URL") })).min(1, "Add at least one video"),
  intro: z.string().min(1, "Write an intro"),
  objectives: z.array(z.object({ value: z.string().min(1) })).min(1),
  summary: z.string().min(1, "Write a summary"),
  notes: z.string().min(1, "Write your notes"),
  publishAt: z.string().min(1, "Pick a publish date"),
  graceHours: z.number().min(1).max(72),
  questions: z.array(questionSchema).min(1, "Add at least one question"),
  task: z.string().optional(),
});

interface FormValues {
  topicId: string;
  dayNumber: number;
  slug: string;
  title: string;
  videoUrls: { url: string }[];
  intro: string;
  objectives: { value: string }[];
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

  function loadDraft(slug: string): Partial<FormValues> | null {
    try {
      const raw = localStorage.getItem(`trice_draft_${slug}`);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function getInitialValues(): FormValues {
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    const draftSlug = params.get("draft");
    const draft = draftSlug ? loadDraft(draftSlug) : null;
    return {
      topicId: draft?.topicId ?? topics[0]?.id ?? "",
      dayNumber: draft?.dayNumber ?? 1,
      slug: draft?.slug ?? "",
      title: draft?.title ?? "",
      videoUrls: draft?.videoUrls ?? [],
      intro: draft?.intro ?? "",
      objectives: draft?.objectives ?? [],
      summary: draft?.summary ?? "",
      notes: draft?.notes ?? "",
      publishAt: draft?.publishAt ?? "",
      graceHours: draft?.graceHours ?? 24,
      questions: draft?.questions ?? [],
      task: draft?.task ?? "",
    };
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getInitialValues(),
    shouldFocusError: false,
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = form;

  const watchedTitle = watch("title");
  const watchedSlug = watch("slug");
  const slugTouchedRef = useRef(false);

  useEffect(() => {
    if (slugTouchedRef.current) return;
    if (watchedTitle) {
      const generated = watchedTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setValue("slug", generated, { shouldValidate: false });
    }
  }, [watchedTitle, setValue]);

  const saveDraft = useCallback(() => {
    const slug = getValues("slug") || getValues("title").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (!slug) return;
    try { localStorage.setItem(`trice_draft_${slug}`, JSON.stringify(getValues())); } catch {}
  }, [getValues]);

  const allValues = watch();

  const draftTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(saveDraft, 1000);
    return () => { if (draftTimer.current) clearTimeout(draftTimer.current); };
  }, [allValues, saveDraft]);

  useEffect(() => {
    const onUnload = () => saveDraft();
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [saveDraft]);

  useEffect(() => {
    if (allValues.slug) {
      const url = new URL(window.location.href);
      if (url.searchParams.get("draft") !== allValues.slug) {
        url.searchParams.set("draft", allValues.slug);
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, [allValues.slug]);

  const objectivesArray = useFieldArray<FormValues, "objectives">({ control, name: "objectives" });
  const questionsArray = useFieldArray<FormValues, "questions">({ control, name: "questions" });
  const videoUrlsArray = useFieldArray<FormValues, "videoUrls">({ control, name: "videoUrls" });

  function onSubmit(values: FormValues) {
    setServerError(null);
    startTransition(async () => {
      try {
        await createDay({
          ...values,
          objectives: values.objectives.map((o) => o.value),
          videoUrls: values.videoUrls.map((v) => v.url),
        });
        try { localStorage.removeItem(`trice_draft_${values.slug}`); } catch {}
      } catch (e) {
        if (e && typeof e === "object" && "digest" in e && String(e.digest).startsWith("NEXT_REDIRECT")) {
          throw e;
        }
        setServerError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  }

  const fieldErrorClass = "text-sm text-destructive mt-0.5";

  const fieldNames: Record<string, string> = {
    topicId: "topic",
    dayNumber: "day number",
    slug: "slug",
    title: "title",
    videoUrls: "video URLs",
    intro: "intro",
    objectives: "objectives",
    summary: "summary",
    notes: "your notes",
    publishAt: "publishes at",
    graceHours: "grace period",
    questions: "quiz questions",
    task: "hand-graded task",
  };

  const invalidFields = Object.keys(errors).map((k) => fieldNames[k] ?? k);
  const hasErrors = invalidFields.length > 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {(hasErrors || serverError) && (
        <div className="rounded-sm border border-destructive/50 bg-destructive/10 px-4 py-3 font-mono text-sm text-destructive">
          {serverError
            ? serverError
            : `${invalidFields.join(", ")} ${invalidFields.length === 1 ? "needs" : "need"} fixing.`}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="topicId">topic</Label>
          <Controller
            control={control}
            name="topicId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a topic" />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
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
        <Input
          {...register("slug")}
          placeholder="binary-search-revisited"
          onInput={() => { slugTouchedRef.current = true; }}
        />
        {errors.slug && <p className={fieldErrorClass}>{errors.slug.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">title</Label>
        <Input {...register("title")} />
        {errors.title && <p className={fieldErrorClass}>{errors.title.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>video URLs (embed links)</Label>
        {videoUrlsArray.fields.map((field, i) => (
          <div key={field.id} className="flex gap-2">
            <Input {...register(`videoUrls.${i}.url`)} placeholder="https://www.youtube.com/embed/..." />
            {videoUrlsArray.fields.length > 1 && (
              <button
                type="button"
                onClick={() => videoUrlsArray.remove(i)}
                className="text-muted-foreground"
                aria-label="Remove video"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
        {errors.videoUrls && (
          <p className={fieldErrorClass}>{errors.videoUrls.message}</p>
        )}
        <button
          type="button"
          onClick={() => videoUrlsArray.append({ url: "" })}
          className="flex items-center gap-1 self-start font-mono text-[11px] text-primary"
        >
          <Plus className="h-3 w-3" /> add video
        </button>
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
            <Input {...register(`objectives.${i}.value`)} />
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
          onClick={() => objectivesArray.append({ value: "" })}
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
          <Controller
            control={control}
            name="publishAt"
            render={({ field }) => (
              <DateTimePicker
                value={field.value}
                onChange={field.onChange}
                placeholder="Select date and time..."
              />
            )}
          />
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
                <RadioInput
                  {...register(`questions.${qi}.correctIndex`, { valueAsNumber: true })}
                  value={ci}
                  defaultChecked={getValues(`questions.${qi}.correctIndex`) === ci}
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
              onClick={() => {
                const q = getValues(`questions.${qi}`);
                questionsArray.update(qi, {
                  ...q,
                  choices: [...q.choices, ""],
                });
              }}
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
