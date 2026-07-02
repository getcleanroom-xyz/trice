import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { paymentsRoutes } from "@/routes/payments";
import { dailyDropCron } from "@/cron/daily-drop";

// This process handles: cron scheduling + payment link generation/webhooks.
// The actual email sending runs in a separate process — start it with
// `bun run worker` — so a slow provider (Resend, Flutterwave) never blocks
// the HTTP server, and either half can be scaled or restarted independently.
const app = new Elysia()
  .use(cors({ origin: process.env.WEB_URL }))
  .use(dailyDropCron)
  .use(paymentsRoutes)
  .get("/health", () => ({ ok: true }))
  .listen(process.env.PORT ?? 4000);

console.log(`trice service listening on :${app.server?.port}`);
