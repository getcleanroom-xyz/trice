import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { pgTable, uuid, text, timestamp, integer } from "drizzle-orm/pg-core";

export const subscribers = pgTable("subscribers", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
});

export const days = pgTable("days", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  publishAt: timestamp("publish_at", { withTimezone: true }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const emailSends = pgTable("email_sends", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscriberId: uuid("subscriber_id").notNull(),
  dayId: uuid("day_id"),
  kind: text("kind").notNull(),
  status: text("status").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
});

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  provider: text("provider").notNull(),
  providerReference: text("provider_reference").notNull(),
  amountMinor: integer("amount_minor").notNull(),
  currency: text("currency").notNull(),
  status: text("status").default("pending").notNull(),
});

export const magicLinks = pgTable("magic_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  token: text("token").notNull(),
  subscriberId: uuid("subscriber_id").notNull(),
  dayId: uuid("day_id").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
});

export const insightTokens = pgTable("insight_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscriberId: uuid("subscriber_id").notNull(),
  weekStart: timestamp("week_start", { withTimezone: true }).notNull(),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
});

export const quizAttempts = pgTable("quiz_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscriberId: uuid("subscriber_id").notNull(),
  dayId: uuid("day_id").notNull(),
  answers: text("answers").notNull(),
  score: integer("score").notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const learningProgress = pgTable("learning_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscriberId: uuid("subscriber_id").notNull(),
  dayId: uuid("day_id").notNull(),
  totalWatchSeconds: integer("total_watch_seconds").notNull().default(0),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

let _db: PostgresJsDatabase | null = null;

function getDb(): PostgresJsDatabase {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  _db = drizzle(postgres(url, { prepare: false }));
  return _db;
}

export const db = new Proxy({} as PostgresJsDatabase, {
  get(_target, prop) {
    const target = getDb();
    const value = (target as Record<string | symbol, unknown>)[prop];
    if (typeof value === "function") return value.bind(target);
    return value;
  },
});
