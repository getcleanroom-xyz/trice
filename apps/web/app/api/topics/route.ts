import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { topics } from "@/lib/db/schema";

const topicSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  sortOrder: z.number().int(),
});

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const parsed = topicSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    sortOrder: Number(formData.get("sortOrder")),
  });
  if (!parsed.success) {
    return NextResponse.redirect(new URL("/admin/topics/new?error=invalid", req.url));
  }

  await db.insert(topics).values(parsed.data);
  return NextResponse.redirect(new URL("/admin", req.url));
}
