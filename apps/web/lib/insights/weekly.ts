import { db } from "@/lib/db/client";
import { days, quizAttempts, learningProgress, subscribers } from "@/lib/db/schema";
import { and, eq, gte, lte, desc } from "drizzle-orm";

export type WeekInsights = {
  subscriber: { email: string; currentStreak: number; longestStreak: number };
  weekStart: Date;
  weekEnd: Date;
  days: {
    id: string;
    dayNumber: number;
    title: string;
    slug: string;
    publishAt: Date;
    watched: boolean;
    watchSeconds: number;
    quizScore: number | null;
    quizTotal: number;
    taskSubmitted: boolean;
  }[];
  totals: {
    daysAvailable: number;
    daysShownUp: number;
    totalWatchMinutes: number;
    totalQuizCorrect: number;
    totalQuizQuestions: number;
    averageScore: number;
  };
};

function getWeekBounds(weekStart: Date): { start: Date; end: Date } {
  const start = new Date(weekStart);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start, end };
}

export async function getWeeklyInsights(
  subscriberId: string,
  weekStart: Date,
): Promise<WeekInsights> {
  const { start, end } = getWeekBounds(weekStart);

  const subscriber = (
    await db.query.subscribers.findFirst({
      where: eq(subscribers.id, subscriberId),
      columns: { email: true, currentStreak: true, longestStreak: true },
    })
  ) ?? { email: "", currentStreak: 0, longestStreak: 0 };

  const weekDays = await db.query.days.findMany({
    where: and(gte(days.publishAt, start), lte(days.publishAt, end)),
    orderBy: days.publishAt,
  });

  const dayIds = weekDays.map((d) => d.id);

  const progressRows =
    dayIds.length > 0
      ? await db.query.learningProgress.findMany({
          where: and(
            eq(learningProgress.subscriberId, subscriberId),
          ),
        })
      : [];

  const attemptRows =
    dayIds.length > 0
      ? await db.query.quizAttempts.findMany({
          where: and(
            eq(quizAttempts.subscriberId, subscriberId),
          ),
        })
      : [];

  const progressMap = new Map(progressRows.map((p) => [p.dayId, p]));
  const attemptMap = new Map(attemptRows.map((a) => [a.dayId, a]));

  const dayInsights = weekDays.map((day) => {
    const progress = progressMap.get(day.id);
    const attempt = attemptMap.get(day.id);
    const videoDurations = (day.videoDurations as number[]) ?? [];
    const targetSeconds = videoDurations.reduce((sum, d) => sum + d * 60, 0) || 600;

    return {
      id: day.id,
      dayNumber: day.dayNumber,
      title: day.title,
      slug: day.slug,
      publishAt: day.publishAt,
      watched: !!progress?.completedAt,
      watchSeconds: progress?.totalWatchSeconds ?? 0,
      quizScore: attempt?.score ?? null,
      quizTotal: targetSeconds > 0 ? 0 : 0,
      taskSubmitted: !!(attempt?.taskSubmission && attempt.taskSubmission.length > 0),
    };
  });

  const quizQuestions = await db.query.quizQuestions.findMany({
    where: dayIds.length > 0 ? undefined : undefined,
  });

  const questionsByDay = new Map<string, number>();
  for (const q of quizQuestions) {
    if (dayIds.includes(q.dayId)) {
      questionsByDay.set(q.dayId, (questionsByDay.get(q.dayId) ?? 0) + 1);
    }
  }

  for (const di of dayInsights) {
    di.quizTotal = questionsByDay.get(di.id) ?? 0;
  }

  const daysShownUp = dayInsights.filter((d) => d.watched || d.quizScore !== null).length;
  const totalWatchMinutes = Math.round(
    dayInsights.reduce((sum, d) => sum + d.watchSeconds, 0) / 60,
  );
  const totalQuizCorrect = dayInsights.reduce((sum, d) => sum + (d.quizScore ?? 0), 0);
  const totalQuizQuestions = dayInsights.reduce((sum, d) => sum + d.quizTotal, 0);

  return {
    subscriber,
    weekStart: start,
    weekEnd: end,
    days: dayInsights,
    totals: {
      daysAvailable: weekDays.length,
      daysShownUp,
      totalWatchMinutes,
      totalQuizCorrect,
      totalQuizQuestions,
      averageScore:
        totalQuizQuestions > 0
          ? Math.round((totalQuizCorrect / totalQuizQuestions) * 100)
          : 0,
    },
  };
}
