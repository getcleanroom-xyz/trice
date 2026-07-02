# Trice

Fifteen minutes, spent well. One concept a day, delivered by email, filed away if you miss it.

## Architecture

```
apps/
  web/       Next.js 16 (App Router, Turbopack) + Tailwind v4
             - public site, daily content pages, signup, sign-in
             - owns the database schema (Drizzle) — runs drizzle-kit push on startup
             - server actions: signup, magic-link, quiz grading, admin CRUD

  service/   Bun + Elysia
             - cron-scheduled daily email drops via BullMQ + Redis + Resend
             - payment link generation (Flutterwave + NOWPayments, non-custodial)
             - retryable email worker (separate process)
```

## Deploy (Railway)

### 1. Set up Neon (Postgres)

Create a Neon project → copy the connection string. Run the schema push from your machine:

```bash
cd apps/web
cp .env.example .env.local
# set DATABASE_URL to your Neon connection string
npm install
npx drizzle-kit push
```

### 2. Set up Upstash (Redis)

Create an Upstash Redis database → copy the `REDIS_URL`.

### 3. Deploy to Railway

Connect your GitHub repo from the [Railway dashboard](https://railway.com/new).

Railway auto-detects the Dockerfiles. Create three services:

| Service  | Root Directory   | Config File                        | Needs public URL? |
|----------|-----------------|------------------------------------|--------------------|
| web      | `apps/web`       | `apps/web/railway.toml`            | Yes (port 3000)    |
| service  | `apps/service`   | `apps/service/railway.toml`        | Yes (port 4000)    |
| worker   | `apps/service`   | `apps/service/railway.worker.toml` | No                 |

### 4. Add env vars

For each service in the Railway dashboard, add the required env vars:

| Variable                  | web | service | worker |
|--------------------------|-----|---------|--------|
| `DATABASE_URL`           | ✓   | ✓       | ✓      |
| `REDIS_URL`              |     | ✓       | ✓      |
| `WEB_URL`                | ✓   | ✓       | ✓      |
| `NEXT_PUBLIC_SERVICE_URL`| ✓   |         |        |
| `RESEND_API_KEY`         | ✓   | ✓       | ✓      |
| `ADMIN_EMAIL`            | ✓   |         |        |
| `ADMIN_SESSION_SECRET`   | ✓   |         |        |

### 5. Set up domain

Point `trice.getcleanroom.xyz` to the Railway web service's generated domain.

## Dev (Docker)

```bash
docker compose up -d
```

Brings up web, service, worker, postgres, and redis. Open http://localhost:3000. Admin at /admin.

## Dev (bare metal)

```bash
# web
cd apps/web && cp .env.example .env.local && npm install && npm run dev

# service
cd apps/service && cp .env.example .env && bun install && bun run dev

# worker (separate terminal)
cd apps/service && bun run worker
```

Requires Postgres 16+ and Redis 7+ running locally.

## Env templates

- `.env.production.example` — all production vars
- `apps/web/.env.example` — web-specific
- `apps/service/.env.example` — service-specific (shared by service + worker)
