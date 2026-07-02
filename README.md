# Trice

Fifteen minutes, spent well. One concept a day, delivered by email, filed away if you miss it.

## Architecture

```
trice/
  apps/
    web/       Next.js 16 (App Router, Turbopack) + shadcn/ui + Tailwind v4
               - public site, daily content pages, signup, sign-in
               - owns the database (Drizzle + Postgres)
               - server actions: signup, magic-link, quiz grading, admin CRUD

    service/   Bun + Elysia
               - cron-scheduled daily email drops via BullMQ + Redis + Resend
               - payment link generation (Flutterwave + NOWPayments, non-custodial)
               - retryable email worker in a separate process
```

Both apps share the same Postgres database. Only `web` runs schema migrations (drizzle-kit push). `service` reads/writes its own subset of tables.

## Quick Start (Docker)

```bash
cp .env.production.example .env.production
# fill in DB_PASSWORD, RESEND_API_KEY, ADMIN_*, etc.

docker compose up -d
```

Open http://localhost:3000. Admin at /admin (sign in with ADMIN_EMAIL).

## Production Deploy

### Railway

```bash
railway up --env-file .env.production -f docker-compose.prod.yml
```

Then point `trice.getcleanroom.xyz` DNS to the Railway web service.

### Manual (VPS)

```bash
cp .env.production.example .env.production
# fill in all values

docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

Schema is pushed automatically on web container startup (via entrypoint.sh).

## Dev

```bash
# each app starts with its dev Docker compose
docker compose up web service worker -d
```

Or run bare-metal:

```bash
# web
cd apps/web && cp .env.example .env.local && npm install && npm run dev

# service + worker
cd apps/service && cp .env.example .env && bun install && bun run dev
# worker (separate terminal)
cd apps/service && bun run worker
```

Requires Postgres 16+ and Redis 7+ running locally.

## Environment Variables

See `.env.production.example` for production. Per-app templates at:
- `apps/web/.env.example`
- `apps/service/.env.example`
