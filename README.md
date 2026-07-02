# Trice

Fifteen minutes, spent well. One concept a day, delivered by email, filed away if you miss it.

## Architecture

This is a two-app monorepo:

```
trice/
  apps/
    web/        Next.js 16 (App Router, Turbopack, React 19 canary) + shadcn/ui + Tailwind v4
                 - the public site, the daily content pages, signup, sign-in
                 - owns the database (Drizzle + Postgres) and almost all business logic
                 - server actions handle signup, magic-link requests, quiz grading
    service/    Bun + Elysia
                 - a small, focused service that does two things Next.js server actions
                   are the wrong shape for:
                   1. queuing + sending the daily drop email to every subscriber, on a
                      cron schedule, via BullMQ + Redis workers (retryable, observable,
                      won't block a request/response cycle)
                   2. generating payment links for tips (NGN via Flutterwave, crypto via
                      NOWPayments) without ever holding funds or a wallet key itself
```

Why split it this way: Next.js server actions are great for anything triggered by a user
in a request, but a "send 4,000 emails at 7am WAT, retry the failures, don't block
anything" job wants a real queue and a long-running worker process, which App Router
deployments (serverless-first) are not built for. Elysia on Bun is a tiny, fast surface
for exactly that, plus the two payment webhook endpoints.

Both apps read from the same Postgres database (`DATABASE_URL`), but only `web` runs
migrations. `service` only reads subscriber/content rows it needs and writes
`payment` / `email_send` rows back.

## Getting the pieces running

### Prerequisites
- Node.js 22+ (for `web`)
- Bun 1.2+ (for `service`) — install from https://bun.sh
- Postgres 16+
- Redis 7+ (queue backing store for BullMQ)

### 1. Database
```
cd apps/web
cp .env.example .env.local   # fill in DATABASE_URL, RESEND_API_KEY, etc.
npm install
npx drizzle-kit push
npm run dev
```

### 2. Queue + payments service
```
cd apps/service
cp .env.example .env
bun install
bun run dev
```

## What's implemented vs stubbed

Implemented as real, working code:
- Full Drizzle schema (subscribers, topics, days, quiz questions/attempts, magic links,
  layout preferences, payments)
- Signup + magic-link request server actions, with expiring tokens
- Daily content page shell wired to the schema (video, note card, tabs, closing-page quiz)
- Elysia service: cron trigger, BullMQ queue + worker for the daily drop, Flutterwave and
  NOWPayments link-generation endpoints with webhook verification

## What's implemented

Everything from the original scaffold, plus the three pieces that were
previously stubbed:

- **Draggable/resizable layout** — `apps/web/components/day-layout.tsx`
  wraps the video, notes, tabs, and quiz panels in `react-grid-layout`.
  Position/size autosave (debounced ~600ms) to `layout_preferences`, keyed
  by an anonymous device-token cookie minted in `proxy.ts` on first visit
  to `/day/*` — same device, any browser, no login involved.
- **Admin content authoring** — a password-free admin area at `/admin`,
  gated by a magic link sent only to `ADMIN_EMAIL` (see
  `app/admin/actions.ts`, `app/admin/verify/route.ts`, and the session
  cookie logic in `lib/admin/session.ts`, enforced in `proxy.ts`). The
  authoring form at `/admin/days/new` covers title, video URL, intro,
  objectives, summary, your notes, publish time, grace-period hours, and a
  dynamic quiz builder (multiple choice + one optional hand-graded task),
  published atomically in a single DB transaction.
- **Live FX for crypto tips** — `apps/service/src/fx.ts` fetches a live
  NGN→USD rate from fawazahmed0's currency-api (free, keyless, covers NGN —
  Frankfurter doesn't, since it only carries the ~30 currencies the ECB
  itself publishes), with a documented CDN fallback and a 1-hour cache.

## Still worth knowing about before shipping

- **Admin auth email volume** — the admin login email sends directly via
  Resend from the web app (not queued), which is intentional for a
  single-user, low-frequency flow, but worth knowing if you ever add more
  admins.
- Nothing here has been run (no bun in the sandbox this was built in) — do
  an install + smoke test pass before trusting it in production.
