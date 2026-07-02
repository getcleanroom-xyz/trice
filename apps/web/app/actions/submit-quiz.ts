"use server";

import { db } from "@/lib/db/client";
import { quizQuestions, quizAttempts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function submitQuiz(
  subscriberId: string,
  dayId: string,
  answers: number[],
  taskSubmission?: string,
) {
  const questions = await db.query.quizQuestions.findMany({
    where: eq(quizQuestions.dayId, dayId),
  });

  const score = questions.reduce(
    (acc, q, i) => acc + (answers[i] === q.correctIndex ? 1 : 0),
    0,
  );

  await db
    .insert(quizAttempts)
    .values({ subscriberId, dayId, answers, score, taskSubmission })
    .onConflictDoUpdate({
      target: [quizAttempts.subscriberId, quizAttempts.dayId],
      set: { answers, score, taskSubmission },
    });

  return { score, total: questions.length };
}
