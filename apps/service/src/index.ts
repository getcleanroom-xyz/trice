import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { cron } from "@elysiajs/cron";
import { paymentsRoutes } from "@/routes/payments";
import { dailyDropRun, weeklyInsightsRun } from "@/email/cron";

const app = new Elysia()
  .use(cors({ origin: process.env.WEB_URL }))
  .use(cron({
    name: "daily-drop",
    pattern: "*/10 * * * *",
    timezone: "Africa/Lagos",
    run: dailyDropRun,
  }))
  .use(cron({
    name: "weekly-insights",
    pattern: "0 20 * * 0",
    timezone: "Africa/Lagos",
    run: weeklyInsightsRun,
  }))
  .use(paymentsRoutes)
  .get("/health", () => ({ ok: true }))
  .listen(process.env.PORT ?? 4000);
