"use server";

import { z } from "zod";
import { db } from "@/lib/db/client";
import { topics } from "@/lib/db/schema";
import { redirect } from "next/navigation";

const topicSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  sortOrder: z.number().int(),
});

export type CreateTopicState = { ok: boolean; error?: string };

export async function createTopic(
  _prev: CreateTopicState,
  formData: FormData,
): Promise<CreateTopicState> {
  const raw = {
    title: formData.get("title"),
    description: formData.get("description"),
    sortOrder: Number(formData.get("sortOrder")),
  };
  const parsed = topicSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Please fill all fields correctly." };

  await db.insert(topics).values(parsed.data);
  redirect("/admin");
}
