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
  videoUrls: z.array(z.string().url("Enter a valid URL")).min(1, "Add at least one video"),
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
        videoUrls: parsed.data.videoUrls,
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

export async function updateDay(id: string, input: CreateDayInput) {
  const parsed = daySchema.safeParse(input);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Invalid fields: ${fields}`);
  }

  const publishAt = new Date(parsed.data.publishAt);
  const expiresAt = new Date(publishAt.getTime() + parsed.data.graceHours * 60 * 60 * 1000);

  await db.transaction(async (tx) => {
    await tx
      .update(days)
      .set({
        topicId: parsed.data.topicId,
        dayNumber: parsed.data.dayNumber,
        slug: parsed.data.slug,
        title: parsed.data.title,
        videoUrls: parsed.data.videoUrls,
        intro: parsed.data.intro,
        objectives: parsed.data.objectives,
        summary: parsed.data.summary,
        notes: parsed.data.notes,
        publishAt,
        expiresAt,
      })
      .where(eq(days.id, id));

    await tx.delete(quizQuestions).where(eq(quizQuestions.dayId, id));
    await tx.delete(quizTasks).where(eq(quizTasks.dayId, id));

    await tx.insert(quizQuestions).values(
      parsed.data.questions.map((q, i) => ({
        dayId: id,
        sortOrder: i,
        prompt: q.prompt,
        choices: q.choices,
        correctIndex: q.correctIndex,
      })),
    );

    if (parsed.data.task) {
      await tx.insert(quizTasks).values({ dayId: id, prompt: parsed.data.task });
    }
  });

  redirect("/admin");
}

export async function listTopics() {
  return db.query.topics.findMany({ orderBy: topics.sortOrder });
}

export async function listDays() {
  return db.query.days.findMany({ orderBy: days.publishAt });
}

export async function getDay(id: string) {
  return db.query.days.findFirst({ where: eq(days.id, id) });
}

export async function getDayQuestions(dayId: string) {
  return db.query.quizQuestions.findMany({ where: eq(quizQuestions.dayId, dayId) });
}

export async function deleteTopic(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return;
  await db.delete(topics).where(eq(topics.id, id));
  redirect("/admin");
}

export async function deleteDay(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return;

  const day = await db.query.days.findFirst({ where: eq(days.id, id) });
  if (!day) return;

  const now = Date.now();
  const twoHoursMs = 2 * 60 * 60 * 1000;
  const isExpired = day.expiresAt.getTime() < now;
  const isMoreThan2hBeforePublish = day.publishAt.getTime() - now > twoHoursMs;

  if (!isExpired && !isMoreThan2hBeforePublish) return;

  await db.transaction(async (tx) => {
    await tx.delete(quizQuestions).where(eq(quizQuestions.dayId, id));
    await tx.delete(quizTasks).where(eq(quizTasks.dayId, id));
    await tx.delete(days).where(eq(days.id, id));
  });

  redirect("/admin");
}
