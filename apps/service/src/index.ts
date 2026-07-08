import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { paymentsRoutes } from "@/routes/payments";
import { dailyDropCron } from "@/email/cron";

const app = new Elysia()
  .use(cors({ origin: process.env.WEB_URL }))
  .use(dailyDropCron)
  .use(paymentsRoutes)
  .get("/health", () => ({ ok: true }))
  .listen(process.env.PORT ?? 4000);

