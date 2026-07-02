# Trice

Fifteen minutes, spent well. One concept a day, delivered by email, filed away if you miss it.

## Architecture

```
apps/
  web/       Next.js 16 (App Router, Turbopack) + Tailwind v4
             - public site, daily content pages, signup, sign-in
             - owns the database schema (Drizzle + Postgres)
             - server actions: signup, magic-link, quiz grading, admin CRUD

  service/   Bun + Elysia
             - cron-scheduled daily email drops via BullMQ + Redis + Resend
             - payment link generation (Flutterwave + NOWPayments, non-custodial)
             - retryable email worker (separate process)
```

Both apps share the same Postgres database via `DATABASE_URL`. Only `web` owns the schema.

## First Deploy

### 1. Schema push (one-time)

```bash
cd apps/web
cp .env.example .env.local
# set DATABASE_URL to your Neon connection string
npm install
npx drizzle-kit push        # creates all tables
```

### 2. Deploy to Railway

Connect the repo from [railway.com/new](https://railway.com/new). Create 3 services in a single project (manually add services from the canvas, don't use "Deploy from GitHub"):

| Service  | Root Dir       | Config File                        | Needs domain? |
|----------|---------------|------------------------------------|---------------|
| web      | `/apps/web`    | (default)                          | Yes           |
| service  | `/apps/service`| (default)                          | Yes           |
| worker   | `/apps/service`| `/apps/service/railway.worker.toml`| No            |

### 3. Env vars per service

| Variable                  | web | service | worker |
|--------------------------|-----|---------|--------|
| `DATABASE_URL`           | ✓   | ✓       | ✓      |
| `REDIS_URL`              |     | ✓       | ✓      |
| `WEB_URL`                | ✓   | ✓       | ✓      |
| `NEXT_PUBLIC_SERVICE_URL`| ✓   |         |        |
| `SERVICE_URL`            |     | ✓       |        |
| `RESEND_API_KEY`         | ✓   | ✓       | ✓      |
| `ADMIN_EMAIL`            | ✓   |         |        |
| `ADMIN_SESSION_SECRET`   | ✓   |         |        |

`NEXT_PUBLIC_SERVICE_URL` and `SERVICE_URL` should both be the Railway-generated domain for the service (e.g. `https://trice-service-production.up.railway.app`).

Tip: set `DATABASE_URL`, `REDIS_URL`, `RESEND_API_KEY`, and `WEB_URL` as Railway Shared Variables so all services inherit them.

### 4. Domain

Point `trice.getcleanroom.xyz` CNAME to the web service's Railway domain. Add the custom domain in Railway's service settings → Networking.

## Dev (Docker Compose)

```bash
docker compose up -d
```

Brings up everything with local Postgres and Redis. Open http://localhost:3000.

## Dev (bare metal)

```bash
cd apps/web && npm install && npm run dev
cd apps/service && bun install && bun run dev    # + bun run worker in another terminal
```
