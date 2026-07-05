import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// A subscriber signs up with just an email — no password, ever. Access is
// always through a fresh, single-day magic link (see magicLinks below).
export const subscribers = pgTable("subscribers", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  currentStreak: integer("current_streak").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
  // A random, unguessable token stored in an HttpOnly cookie on first visit.
  // Lets the draggable-layout preferences (and streak display) persist on
  // the same device across browsers, without ever being a login mechanism.
  deviceToken: text("device_token"),
  unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
}, (t) => ({
  emailIdx: uniqueIndex("subscribers_email_idx").on(t.email),
}));

// A topic is a "chapter" that can span multiple weeks (per the brief: a
// topic isn't locked to exactly one week).
export const topics = pgTable("topics", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

// One row per calendar day of content. `publishAt` is when the morning
// email goes out; `expiresAt` is the hard cutoff (publishAt + grace period,
// e.g. 24-48h) after which the content page 404s for anyone who didn't
// finish it in time — the "library due-date card" mechanic.
export const days = pgTable("days", {
  id: uuid("id").primaryKey().defaultRandom(),
  topicId: uuid("topic_id").notNull().references(() => topics.id),
  dayNumber: integer("day_number").notNull(),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  videoUrls: jsonb("video_urls").$type<string[]>().notNull(),
  videoDurations: jsonb("video_durations").$type<number[]>().default([]).notNull(),
  intro: text("intro").notNull(),
  objectives: jsonb("objectives").$type<string[]>().notNull(),
  summary: text("summary").notNull(),
  // Your personal learning notes — rendered in the pinned "note card".
  notes: text("notes").notNull(),
  publishAt: timestamp("publish_at", { withTimezone: true }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
}, (t) => ({
  slugIdx: uniqueIndex("days_slug_idx").on(t.slug),
  publishAtIdx: index("days_publish_at_idx").on(t.publishAt),
}));

export const quizQuestions = pgTable("quiz_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  dayId: uuid("day_id").notNull().references(() => days.id),
  sortOrder: integer("sort_order").notNull(),
  prompt: text("prompt").notNull(),
  // Auto-graded multiple choice. Free-response "task" questions live in
  // `quizTasks` below and are graded by hand (for now).
  choices: jsonb("choices").$type<string[]>().notNull(),
  correctIndex: integer("correct_index").notNull(),
});

export const quizTasks = pgTable("quiz_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  dayId: uuid("day_id").notNull().references(() => days.id),
  prompt: text("prompt").notNull(),
});

export const quizAttempts = pgTable("quiz_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscriberId: uuid("subscriber_id").notNull().references(() => subscribers.id),
  dayId: uuid("day_id").notNull().references(() => days.id),
  answers: jsonb("answers").$type<number[]>().notNull(),
  score: integer("score").notNull(),
  taskSubmission: text("task_submission"),
  taskGrade: text("task_grade"), // null until you grade it by hand
  completedAt: timestamp("completed_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  oneAttemptPerDay: uniqueIndex("quiz_attempts_subscriber_day_idx").on(
    t.subscriberId,
    t.dayId,
  ),
}));

// A single-use, single-day token. The morning email links here; the
// sign-in page (for someone who lost the email) issues a fresh one too.
export const magicLinks = pgTable("magic_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  token: text("token").notNull(),
  subscriberId: uuid("subscriber_id").notNull().references(() => subscribers.id),
  dayId: uuid("day_id").notNull().references(() => days.id),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
}, (t) => ({
  tokenIdx: uniqueIndex("magic_links_token_idx").on(t.token),
}));

// Single-use, short-lived login token for the one admin account (there's
// only ever one — you). Separate from `magicLinks`, which is a subscriber-
// facing, day-scoped concept; this one just proves "this request came from
// the admin's inbox" and is checked against ADMIN_EMAIL, not a DB row of
// allowed admins.
export const adminLoginTokens = pgTable("admin_login_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
}, (t) => ({
  tokenIdx: uniqueIndex("admin_login_tokens_token_idx").on(t.token),
}));

// Saved drag/resize layout for the daily content page, keyed by device
// token rather than subscriber, per the "same device, not just browser"
// requirement.
export const layoutPreferences = pgTable("layout_preferences", {
  deviceToken: text("device_token").primaryKey(),
  layout: jsonb("layout").notNull(), // TODO: shape this once react-grid-layout is wired up
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// A tip, in either currency. `service` (the Elysia app) writes rows here
// once a Flutterwave or NOWPayments webhook confirms payment.
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  provider: text("provider", { enum: ["flutterwave", "nowpayments"] }).notNull(),
  providerReference: text("provider_reference").notNull(),
  amountMinor: integer("amount_minor").notNull(), // kobo, or the crypto's smallest unit
  currency: text("currency").notNull(),
  status: text("status", { enum: ["pending", "confirmed", "failed"] })
    .default("pending")
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  refIdx: uniqueIndex("payments_provider_reference_idx").on(t.providerReference),
}));

export const emailSends = pgTable("email_sends", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscriberId: uuid("subscriber_id").notNull().references(() => subscribers.id),
  dayId: uuid("day_id").references(() => days.id),
  kind: text("kind", { enum: ["confirmation", "daily_drop"] }).notNull(),
  status: text("status", { enum: ["queued", "sent", "failed"] })
    .default("queued")
    .notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
});

export const learningProgress = pgTable("learning_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscriberId: uuid("subscriber_id").notNull().references(() => subscribers.id),
  dayId: uuid("day_id").notNull().references(() => days.id),
  totalWatchSeconds: integer("total_watch_seconds").notNull().default(0),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  subscriberDayIdx: uniqueIndex("learning_progress_subscriber_day_idx").on(
    t.subscriberId,
    t.dayId,
  ),
}));

export const insightTokens = pgTable("insight_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscriberId: uuid("subscriber_id").notNull().references(() => subscribers.id),
  weekStart: timestamp("week_start", { withTimezone: true }).notNull(),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
}, (t) => ({
  tokenIdx: uniqueIndex("insight_tokens_token_idx").on(t.token),
}));
