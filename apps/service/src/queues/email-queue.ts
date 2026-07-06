import { Queue, type ConnectionOptions } from "bullmq";

const redisUrl = new URL(process.env.REDIS_URL ?? "redis://localhost:6379");

const isLocal = ["localhost", "127.0.0.1", "redis"].includes(redisUrl.hostname);
const useTls = redisUrl.protocol === "rediss:" || !isLocal;

export const connection: ConnectionOptions = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port || (useTls ? 6380 : 6379)),
  password: redisUrl.password || undefined,
  maxRetriesPerRequest: null,
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
