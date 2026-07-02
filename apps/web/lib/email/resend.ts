import { Resend } from "resend";

// Only used for the admin login email — one send per login, to one person.
// Everything subscriber-facing (confirmation + daily drop) goes through the
// `service` app's queue instead; see apps/service/src/workers/email-worker.ts.
export const resend = new Resend(process.env.RESEND_API_KEY);
