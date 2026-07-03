"use server";

import { z } from "zod";
import { db } from "@/lib/db/client";
import { topics, days, quizQuestions, quizTasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

const dayQuestionSchema = z.object({
  prompt: z.string().min(1),
  choices: z.array(z.string().min(1)).min(2),
  correctIndex: z.number().int().min(0),
});

const daySchema = z.object({
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
  questions: z.array(dayQuestionSchema).min(1),
  task: z.string().optional(),
});

export type CreateDayInput = z.infer<typeof daySchema>;

export async function createDay(input: CreateDayInput) {
  const parsed = daySchema.safeParse(input);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Invalid fields: ${fields}`);
  }

  const publishAt = new Date(parsed.data.publishAt);
  const expiresAt = new Date(publishAt.getTime() + parsed.data.graceHours * 60 * 60 * 1000);

  // A day and its quiz are one unit of publishing — if the quiz insert
  // fails, the day shouldn't exist half-published.
  const dayId = await db.transaction(async (tx) => {
    const [day] = await tx
      .insert(days)
      .values({
        topicId: parsed.data.topicId,
        dayNumber: parsed.data.dayNumber,
        slug: parsed.data.slug,
        title: parsed.data.title,
        videoUrl: parsed.data.videoUrl,
        intro: parsed.data.intro,
        objectives: parsed.data.objectives,
        summary: parsed.data.summary,
        notes: parsed.data.notes,
        publishAt,
        expiresAt,
      })
      .returning();

    await tx.insert(quizQuestions).values(
      parsed.data.questions.map((q, i) => ({
        dayId: day.id,
        sortOrder: i,
        prompt: q.prompt,
        choices: q.choices,
        correctIndex: q.correctIndex,
      })),
    );

    if (parsed.data.task) {
      await tx.insert(quizTasks).values({ dayId: day.id, prompt: parsed.data.task });
    }

    return day.id;
  });

  redirect(`/admin?created=${dayId}`);
}

export async function listTopics() {
  return db.query.topics.findMany({ orderBy: topics.sortOrder });
}

export async function listDays() {
  return db.query.days.findMany({ orderBy: days.publishAt });
}
