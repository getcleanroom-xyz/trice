import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { pgTable, uuid, text, timestamp, integer } from "drizzle-orm/pg-core";

// This is a deliberately narrow, service-owned view of the shared schema —
// only the columns the queue worker and payment routes actually touch.
// TODO: once the schema stabilizes, extract apps/web/lib/db/schema.ts into
// a `packages/db` workspace package and import the real tables from both
// apps instead of hand-mirroring them here.
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

const client = postgres(process.env.DATABASE_URL!, { prepare: false });
export const db = drizzle(client);
