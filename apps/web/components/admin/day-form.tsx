"use client";

import { useState, useEffect, useTransition, useRef, useCallback } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { createDay, updateDay } from "@/app/admin/content-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { FormWizard, type Step } from "./form-wizard";
import { LivePreview } from "./live-preview";
import { ValidationChecklist, type CheckItem } from "./validation-checklist";
import { VideoPreview } from "./video-preview";

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
  videoDurations: z.array(z.number().min(1)),
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
  videoDurations: number[];
  intro: string;
  objectives: { value: string }[];
  summary: string;
  notes: string;
  publishAt: string;
  graceHours: number;
  questions: { prompt: string; choices: string[]; correctIndex: number }[];
  task?: string;
}

const STEPS: Step[] = [
  { id: "basics", label: "Basics" },
  { id: "media", label: "Media" },
  { id: "content", label: "Content" },
  { id: "quiz", label: "Quiz" },
  { id: "schedule", label: "Schedule" },
  { id: "review", label: "Review" },
];

function pad(n: number) { return String(n).padStart(2, "0"); }
function toLocalString(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function DayForm({ topics, dayData, dayId }: { topics: { id: string; title: string }[]; dayData?: Partial<FormValues>; dayId?: string }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState(0);
  const { toast } = useToast();

  function loadDraft(slug: string): Partial<FormValues> | null {
    try {
      const raw = localStorage.getItem(`trice_draft_${slug}`);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function getInitialValues(): FormValues {
    const source = dayData;
    return {
      topicId: source?.topicId ?? topics[0]?.id ?? "",
      dayNumber: source?.dayNumber ?? 1,
      slug: source?.slug ?? "",
      title: source?.title ?? "",
      videoUrls: source?.videoUrls ?? [],
      videoDurations: source?.videoDurations ?? [],
      intro: source?.intro ?? "",
      objectives: source?.objectives ?? [],
      summary: source?.summary ?? "",
      notes: source?.notes ?? "",
      publishAt: source?.publishAt ?? "",
      graceHours: source?.graceHours ?? 24,
      questions: (source?.questions ?? []).filter((q: FormValues["questions"][0]) => q.prompt || q.choices.some((c: string) => c !== "")),
      task: source?.task ?? "",
    };
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getInitialValues(),
    shouldFocusError: false,
  });

  useEffect(() => {
    if (dayData) return;
    const params = new URLSearchParams(window.location.search);
    const draftSlug = params.get("draft");
    if (draftSlug) {
      const draft = loadDraft(draftSlug);
      if (draft) form.reset(draft);
    }
  }, []);

  const { register, control, handleSubmit, watch, setValue, getValues, formState: { errors } } = form;

  const watchedTitle = watch("title");
  const allValues = watch();
  const slugTouchedRef = useRef(false);

  useEffect(() => {
    if (slugTouchedRef.current) return;
    if (dayData) return;
    if (!watchedTitle) return;
    const generated = watchedTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    setValue("slug", generated, { shouldValidate: false });
  }, [watchedTitle, dayData, setValue]);

  const saveDraft = useCallback(() => {
    const slug = getValues("slug") || getValues("title").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (!slug) return;
    try { localStorage.setItem(`trice_draft_${slug}`, JSON.stringify(getValues())); } catch {}
  }, [getValues]);

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
        const flat = {
          ...values,
          objectives: values.objectives.map((o) => o.value),
          videoUrls: values.videoUrls.map((v) => v.url),
          videoDurations: values.videoDurations ?? [],
        };
        if (dayId) {
          await updateDay(dayId, flat);
        } else {
          await createDay(flat);
        }
        try { localStorage.removeItem(`trice_draft_${flat.slug}`); } catch {}
        toast("Day published successfully!", "success");
      } catch (e) {
        if (e && typeof e === "object" && "digest" in e && String(e.digest).startsWith("NEXT_REDIRECT")) {
          throw e;
        }
        setServerError(e instanceof Error ? e.message : "Something went wrong.");
        toast("Failed to publish day", "error");
      }
    });
  }

  const fieldErrorClass = "text-sm text-destructive mt-0.5";
  const fieldNames: Record<string, string> = {
    topicId: "topic", dayNumber: "day number", slug: "slug", title: "title",
    videoUrls: "video URLs", intro: "intro", objectives: "objectives", summary: "summary",
    notes: "your notes", publishAt: "publishes at", graceHours: "grace period",
    questions: "quiz questions", task: "hand-graded task",
  };
  const invalidFields = Object.keys(errors).map((k) => fieldNames[k] ?? k);

  const checklist: CheckItem[] = [
    { label: "Topic selected", done: !!allValues.topicId },
    { label: "Title", done: !!allValues.title },
    { label: "Slug", done: !!allValues.slug },
    { label: "Video URLs", done: allValues.videoUrls.filter((v) => v.url).length > 0 },
    { label: "Intro", done: !!allValues.intro },
    { label: "Objectives", done: allValues.objectives.filter((o) => o.value).length > 0 },
    { label: "Summary", done: !!allValues.summary },
    { label: "Notes", done: !!allValues.notes },
    { label: "Publish date", done: !!allValues.publishAt },
    { label: "Quiz questions", done: allValues.questions.filter((q) => q.prompt && q.choices.filter(Boolean).length >= 2).length > 0 },
  ];

  const preview = (
    <LivePreview
      title={allValues.title}
      videoUrls={allValues.videoUrls}
      intro={allValues.intro}
      objectives={allValues.objectives}
      summary={allValues.summary}
      notes={allValues.notes}
      task={allValues.task ?? ""}
    />
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {(invalidFields.length > 0 || serverError) && (
        <div className="rounded-sm border border-destructive/50 bg-destructive/10 px-4 py-3 font-mono text-sm text-destructive">
          {serverError
            ? serverError
            : `${invalidFields.join(", ")} ${invalidFields.length === 1 ? "needs" : "need"} fixing.`}
        </div>
      )}

      <FormWizard steps={STEPS} currentStep={step} onStepChange={setStep}>

        {/* Step 1: Basics */}
        {step === 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-6">
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label>topic</Label>
                  <Controller control={control} name="topicId" render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="Select a topic" /></SelectTrigger>
                      <SelectContent>{topics.map((t) => (<SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>))}</SelectContent>
                    </Select>
                  )} />
                  {errors.topicId && <p className={fieldErrorClass}>{errors.topicId.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>day number</Label>
                  <Input type="number" {...register("dayNumber", { valueAsNumber: true })} />
                  {errors.dayNumber && <p className={fieldErrorClass}>{errors.dayNumber.message}</p>}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>slug (URL)</Label>
                <Input {...register("slug")} placeholder="binary-search-revisited" onInput={() => { slugTouchedRef.current = true; }} />
                {errors.slug && <p className={fieldErrorClass}>{errors.slug.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>title</Label>
                <Input {...register("title")} />
                {errors.title && <p className={fieldErrorClass}>{errors.title.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>intro</Label>
                <Controller control={control} name="intro" render={({ field }) => (
                  <MarkdownEditor value={field.value} onChange={field.onChange} placeholder="Write an intro..." minRows={2} />
                )} />
                {errors.intro && <p className={fieldErrorClass}>{errors.intro.message}</p>}
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="sticky top-4 flex flex-col gap-4">
                {preview}
                <ValidationChecklist items={checklist} />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Media */}
        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-6">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <Label>video URLs (embed links)</Label>
                {videoUrlsArray.fields.map((field, i) => {
                  const duration = allValues.videoDurations?.[i] ?? 10;
                  return (
                    <div key={field.id} className="rounded-sm border border-border p-3 space-y-2">
                      <div className="flex gap-2">
                        <Input {...register(`videoUrls.${i}.url`)} placeholder="https://www.youtube.com/embed/..." />
                        {videoUrlsArray.fields.length > 1 && (
                          <button type="button" onClick={() => {
                            videoUrlsArray.remove(i);
                            const durations = [...(allValues.videoDurations ?? [])];
                            durations.splice(i, 1);
                            setValue("videoDurations", durations, { shouldValidate: false });
                          }} className="text-muted-foreground" aria-label="Remove video">
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[10px] text-muted-foreground whitespace-nowrap">goal</span>
                        <Slider
                          value={[duration]}
                          onValueChange={(v) => {
                            const durations = [...(allValues.videoDurations ?? [])];
                            durations[i] = v[0];
                            setValue("videoDurations", durations, { shouldValidate: false });
                          }}
                          min={1}
                          max={30}
                          step={1}
                          className="flex-1"
                        />
                        <span className="font-mono text-xs text-foreground w-12 text-right">{duration} min</span>
                      </div>
                    </div>
                  );
                })}
                {errors.videoUrls && <p className={fieldErrorClass}>{errors.videoUrls.message}</p>}
                <button type="button" onClick={() => {
                  videoUrlsArray.append({ url: "" });
                  const durations = [...(allValues.videoDurations ?? [])];
                  durations.push(10);
                  setValue("videoDurations", durations, { shouldValidate: false });
                }} className="flex items-center gap-1 self-start font-mono text-[11px] text-primary">
                  <Plus className="h-3 w-3" /> add video
                </button>
              </div>
              <VideoPreview urls={allValues.videoUrls.map((v) => v.url)} />
            </div>
            <div className="hidden lg:block">
              <div className="sticky top-4">{preview}</div>
            </div>
          </div>
        )}

        {/* Step 3: Content */}
        {step === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-6">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <Label>objectives</Label>
                {objectivesArray.fields.map((field, i) => (
                  <div key={field.id} className="flex gap-2">
                    <Input {...register(`objectives.${i}.value`)} />
                    <button type="button" onClick={() => objectivesArray.remove(i)} className="text-muted-foreground" aria-label="Remove objective">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {errors.objectives && <p className={fieldErrorClass}>{errors.objectives.message}</p>}
                <button type="button" onClick={() => objectivesArray.append({ value: "" })} className="flex items-center gap-1 self-start font-mono text-[11px] text-primary">
                  <Plus className="h-3 w-3" /> add objective
                </button>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>summary</Label>
                <Controller control={control} name="summary" render={({ field }) => (
                  <MarkdownEditor value={field.value} onChange={field.onChange} placeholder="Write a summary..." minRows={2} />
                )} />
                {errors.summary && <p className={fieldErrorClass}>{errors.summary.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>your notes</Label>
                <Controller control={control} name="notes" render={({ field }) => (
                  <MarkdownEditor value={field.value} onChange={field.onChange} placeholder="Write your notes..." minRows={3} />
                )} />
                {errors.notes && <p className={fieldErrorClass}>{errors.notes.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>optional hand-graded task</Label>
                <Controller control={control} name="task" render={({ field }) => (
                  <MarkdownEditor value={field.value ?? ""} onChange={field.onChange} placeholder="Write the task prompt..." minRows={2} />
                )} />
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="sticky top-4">{preview}</div>
            </div>
          </div>
        )}

        {/* Step 4: Quiz */}
        {step === 3 && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-6">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-3 rounded-sm border border-border p-4">
                {questionsArray.fields.map((field, qi) => (
                  <div key={field.id} className="rounded-sm border border-border p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-mono text-[10px] text-muted-foreground">question {qi + 1}</span>
                      <button type="button" onClick={() => questionsArray.remove(qi)} className="text-muted-foreground" aria-label="Remove question">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <Input className="mb-2" {...register(`questions.${qi}.prompt`)} placeholder="Prompt" />
                    {errors.questions?.[qi]?.prompt && (
                      <p className={cn(fieldErrorClass, "mb-1")}>{errors.questions[qi].prompt.message}</p>
                    )}
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className="font-mono text-[10px] text-muted-foreground whitespace-nowrap">correct</span>
                      <Controller control={control} name={`questions.${qi}.correctIndex`} render={({ field: rf }) => (
                        <Select value={String(rf.value ?? 0)} onValueChange={(v) => rf.onChange(Number(v))}>
                          <SelectTrigger className="h-8 w-16 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {field.choices.map((_, ci) => (
                              <SelectItem key={ci} value={String(ci)}>{ci + 1}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )} />
                    </div>
                    {field.choices.map((_, ci) => (
                      <div key={ci} className="mb-1.5">
                        <Input {...register(`questions.${qi}.choices.${ci}`)} placeholder={`Choice ${ci + 1}`} />
                      </div>
                    ))}
                    {errors.questions?.[qi]?.choices && (
                      <p className={fieldErrorClass}>{errors.questions[qi].choices.message}</p>
                    )}
                    <button type="button" onClick={() => { const q = getValues(`questions.${qi}`); questionsArray.update(qi, { ...q, choices: [...q.choices, ""] }); }}
                      className="flex items-center gap-1 font-mono text-[11px] text-primary">
                      <Plus className="h-3 w-3" /> add choice
                    </button>
                  </div>
                ))}
                {errors.questions && !Array.isArray(errors.questions) && (
                  <p className={fieldErrorClass}>{errors.questions.message}</p>
                )}
                <button type="button" onClick={() => questionsArray.append({ prompt: "", choices: ["", ""], correctIndex: 0 })}
                  className="flex items-center gap-1 self-start font-mono text-[11px] text-primary">
                  <Plus className="h-3 w-3" /> add question
                </button>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="sticky top-4">{preview}</div>
            </div>
          </div>
        )}

        {/* Step 5: Schedule */}
        {step === 4 && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-6">
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label>publishes at</Label>
                  <Controller control={control} name="publishAt" render={({ field }) => (
                    <DateTimePicker value={field.value} onChange={field.onChange} placeholder="Select date and time..." />
                  )} />
                  {errors.publishAt && <p className={fieldErrorClass}>{errors.publishAt.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>grace period (hours)</Label>
                  <Input type="number" {...register("graceHours", { valueAsNumber: true })} />
                  {errors.graceHours && <p className={fieldErrorClass}>{errors.graceHours.message}</p>}
                </div>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="sticky top-4">
                <ValidationChecklist items={checklist} />
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Review */}
        {step === 5 && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-6">
            <div className="flex flex-col gap-5">
              <ValidationChecklist items={checklist} />
              {invalidFields.length > 0 && (
                <div className="rounded-sm border border-destructive/50 bg-destructive/10 px-4 py-3 font-mono text-sm text-destructive">
                  Fix: {invalidFields.join(", ")} before publishing.
                </div>
              )}
            </div>
            <div className="hidden lg:block">
              <div className="sticky top-4">{preview}</div>
            </div>
          </div>
        )}

      </FormWizard>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button type="button" variant="secondary" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={async () => {
            const stepFields: Record<number, (keyof FormValues)[]> = {
              0: ["topicId", "dayNumber", "slug", "title", "intro"],
              1: ["videoUrls"],
              2: ["objectives", "summary", "notes"],
              3: ["questions"],
              4: ["publishAt", "graceHours"],
            };
            const fields = stepFields[step];
            if (fields) {
              const valid = await form.trigger(fields);
              if (!valid) return;
            }
            setStep((s) => s + 1);
          }}>
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button type="submit" disabled={pending} className="self-start">
            {pending ? "Publishing…" : "Publish day"}
          </Button>
        )}
      </div>
    </form>
  );
}
