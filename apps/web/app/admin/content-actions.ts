"use server";

import { z } from "zod";
import { db } from "@/lib/db/client";
import { topics, days, quizQuestions, quizTasks, quizAttempts, subscribers, emailSends } from "@/lib/db/schema";
import { eq, and, or, like, desc, asc, sql, count, inArray, isNotNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getResend, gradingNotificationHtml } from "@/lib/email";

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
  videoDurations: z.array(z.number().min(1)).optional(),
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

  const [pDatePart, pTimePart] = parsed.data.publishAt.split("T");
  const [pYear, pMonth, pDay] = pDatePart.split("-").map(Number);
  const [pHour, pMinute] = pTimePart.split(":").map(Number);
  const publishAt = new Date(Date.UTC(pYear, pMonth - 1, pDay, pHour - 1, pMinute));
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
        videoDurations: parsed.data.videoDurations ?? [],
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

  const [pDatePart, pTimePart] = parsed.data.publishAt.split("T");
  const [pYear, pMonth, pDay] = pDatePart.split("-").map(Number);
  const [pHour, pMinute] = pTimePart.split(":").map(Number);
  const publishAt = new Date(Date.UTC(pYear, pMonth - 1, pDay, pHour - 1, pMinute));
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
        videoDurations: parsed.data.videoDurations ?? [],
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

export async function listTopics(opts: { q?: string; page?: number; pageSize?: number } = {}) {
  const { q, page = 1, pageSize = 20 } = opts;
  const offset = (page - 1) * pageSize;

  const conditions = q ? or(like(topics.title, `%${q}%`), like(topics.description, `%${q}%`)) : undefined;

  const [data, [{ total }]] = await Promise.all([
    db.query.topics.findMany({
      where: conditions,
      orderBy: topics.sortOrder,
      limit: pageSize,
      offset,
    }),
    db.select({ total: count() }).from(topics).where(conditions),
  ]);

  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function listDays(opts: { q?: string; sort?: string; page?: number; pageSize?: number; topic?: string } = {}) {
  const { q, sort = "date", page = 1, pageSize = 20, topic } = opts;
  const offset = (page - 1) * pageSize;

  const conditions = q ? or(like(days.title, `%${q}%`), sql`cast(${days.dayNumber} as text) like ${"%" + q + "%"}`) : undefined;
  const topicCondition = topic ? eq(days.topicId, topic) : undefined;
  const where = and(conditions, topicCondition);

  const orderBy =
    sort === "title" ? asc(days.title)
    : sort === "status" ? desc(days.publishAt)
    : desc(days.publishAt);

  const [data, [{ total }]] = await Promise.all([
    db.query.days.findMany({ where, orderBy, limit: pageSize, offset }),
    db.select({ total: count() }).from(days).where(where),
  ]);

  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getDay(id: string) {
  return db.query.days.findFirst({ where: eq(days.id, id) });
}

export async function getDayQuestions(dayId: string) {
  return db.query.quizQuestions.findMany({ where: eq(quizQuestions.dayId, dayId) });
}

export async function getTopic(id: string) {
  return db.query.topics.findFirst({ where: eq(topics.id, id) });
}

export async function topicHasDays(topicId: string): Promise<boolean> {
  const [{ total }] = await db.select({ total: count() }).from(days).where(eq(days.topicId, topicId));
  return total > 0;
}

export async function updateTopic(id: string, input: { title: string; description: string; sortOrder: number }) {
  const parsed = z.object({ title: z.string().min(1), description: z.string().min(1), sortOrder: z.number().int() }).safeParse(input);
  if (!parsed.success) throw new Error("Invalid topic data");
  await db.update(topics).set(parsed.data).where(eq(topics.id, id));
  redirect("/admin");
}

export async function deleteTopic(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return;
  await db.delete(topics).where(eq(topics.id, id));
  redirect("/admin");
}

export async function reorderTopics(orderedIds: string[]) {
  await db.transaction(async (tx) => {
    for (let i = 0; i < orderedIds.length; i++) {
      await tx.update(topics).set({ sortOrder: i }).where(eq(topics.id, orderedIds[i]));
    }
  });
}

export async function reorderDays(topicId: string, orderedIds: string[]) {
  await db.transaction(async (tx) => {
    for (let i = 0; i < orderedIds.length; i++) {
      const day = await tx.query.days.findFirst({ where: eq(days.id, orderedIds[i]) });
      if (day) {
        await tx.update(days).set({ dayNumber: i + 1 }).where(eq(days.id, orderedIds[i]));
      }
    }
  });
}

export async function nextTopicSortOrder(): Promise<number> {
  const result = await db.select({ v: sql<number>`COALESCE(MAX(${topics.sortOrder}), -1) + 1` }).from(topics);
  return result[0].v;
}

export async function nextDayNumber(topicId: string): Promise<number> {
  const result = await db.select({ v: sql<number>`COALESCE(MAX(${days.dayNumber}), 0) + 1` }).from(days).where(eq(days.topicId, topicId));
  return result[0].v;
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

export async function listUngradedTasks() {
  const attempts = await db.query.quizAttempts.findMany({
    where: and(isNotNull(quizAttempts.taskSubmission), sql`${quizAttempts.taskSubmission} != ''`),
    orderBy: desc(quizAttempts.completedAt),
  });

  if (attempts.length === 0) return [];

  const subscriberIds = [...new Set(attempts.map((a) => a.subscriberId))];
  const dayIds = [...new Set(attempts.map((a) => a.dayId))];

  const [subs, dayRows, taskRows] = await Promise.all([
    db.query.subscribers.findMany({ where: inArray(subscribers.id, subscriberIds) }),
    db.query.days.findMany({ where: inArray(days.id, dayIds) }),
    db.query.quizTasks.findMany({ where: inArray(quizTasks.dayId, dayIds) }),
  ]);

  const subMap = new Map(subs.map((s) => [s.id, s.email]));
  const dayMap = new Map(dayRows.map((d) => [d.id, d]));
  const taskMap = new Map(taskRows.map((t) => [t.dayId, t.prompt]));

  return attempts.map((a) => ({
    id: a.id,
    subscriberId: a.subscriberId,
    subscriberEmail: subMap.get(a.subscriberId) ?? "unknown",
    dayId: a.dayId,
    dayTitle: dayMap.get(a.dayId)?.title ?? "unknown",
    dayNumber: dayMap.get(a.dayId)?.dayNumber ?? 0,
    taskPrompt: taskMap.get(a.dayId) ?? "",
    taskSubmission: a.taskSubmission ?? "",
    taskGrade: a.taskGrade,
    score: a.score,
    completedAt: a.completedAt,
  }));
}

export async function gradeTask(attemptId: string, grade: string) {
  const [attempt] = await db
    .select({ subscriberId: quizAttempts.subscriberId, dayId: quizAttempts.dayId })
    .from(quizAttempts)
    .where(eq(quizAttempts.id, attemptId));

  await db
    .update(quizAttempts)
    .set({ taskGrade: grade })
    .where(eq(quizAttempts.id, attemptId));

  if (!attempt) return;

  const [subscriber] = await db
    .select({ email: subscribers.email })
    .from(subscribers)
    .where(eq(subscribers.id, attempt.subscriberId));

  const [day] = await db
    .select({ dayNumber: days.dayNumber, title: days.title })
    .from(days)
    .where(eq(days.id, attempt.dayId));

  if (!subscriber || !day) return;

  const { error } = await getResend().emails.send({
    from: "Trice <hello@emails.getcleanroom.xyz>",
    to: subscriber.email,
    subject: `Your task for day ${day.dayNumber} has been graded`,
    html: gradingNotificationHtml({ dayNumber: day.dayNumber, dayTitle: day.title, grade, subscriberId: attempt.subscriberId }),
  });

  await db.insert(emailSends).values({
    subscriberId: attempt.subscriberId,
    dayId: attempt.dayId,
    kind: "grading_notification",
    status: error ? "failed" : "sent",
  });
}
