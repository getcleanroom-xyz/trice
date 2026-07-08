import { Queue, type ConnectionOptions } from "bullmq";

const redisUrl = new URL(process.env.REDIS_URL ?? "redis://localhost:6379");

const useTls = redisUrl.protocol === "rediss:";

export const connection: ConnectionOptions = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port || (useTls ? 6380 : 6379)),
  password: redisUrl.password || undefined,
  maxRetriesPerRequest: null,
  family: 0,
  ...(useTls ? { tls: {} } : {}),
};

export type EmailJob = {
  emailSendId: string;
  kind: "confirmation" | "daily_drop" | "weekly_insights" | "grading_notification";
  subscriberId: string;
  dayId?: string;
  insightTokenId?: string;
  weekStart?: string;
};

export const emailQueue = new Queue<EmailJob, void, "send">("email", { connection });
