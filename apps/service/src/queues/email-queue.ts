import { Queue, type ConnectionOptions } from "bullmq";

const redisUrl = new URL(process.env.REDIS_URL ?? "redis://localhost:6379");

// Passed as plain options rather than an ioredis instance we construct
// ourselves — BullMQ bundles its own copy of ioredis, and a
// separately-installed top-level `ioredis` instance doesn't structurally
// match its internal type even though it's the same library at runtime.
// Letting BullMQ own the connection sidesteps that entirely.
export const connection: ConnectionOptions = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port || 6379),
  password: redisUrl.password || undefined,
  maxRetriesPerRequest: null,
};

export type EmailJob = {
  emailSendId: string;
  kind: "confirmation" | "daily_drop";
  subscriberId: string;
  dayId?: string;
};

export const emailQueue = new Queue<EmailJob, void, "send">("email", { connection });
