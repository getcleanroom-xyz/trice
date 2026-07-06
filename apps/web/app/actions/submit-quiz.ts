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
    orderBy: quizQuestions.sortOrder,
  });

  const results = questions.map((q, i) => ({
    prompt: q.prompt,
    choices: q.choices,
    correctIndex: q.correctIndex,
    chosenIndex: answers[i] ?? -1,
    correct: answers[i] === q.correctIndex,
  }));

  const score = results.filter((r) => r.correct).length;
  let taskGrade: string | null = null;

  if (subscriberId !== "admin") {
    await db
      .insert(quizAttempts)
      .values({ subscriberId, dayId, answers, score, taskSubmission })
      .onConflictDoUpdate({
        target: [quizAttempts.subscriberId, quizAttempts.dayId],
        set: { answers, score, taskSubmission },
      });
  }

  return { score, total: questions.length, results, taskGrade };
}
