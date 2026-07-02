import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let _db: PostgresJsDatabase<typeof schema> | null = null;

function getDb(): PostgresJsDatabase<typeof schema> {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  _db = drizzle(postgres(url, { prepare: false }), { schema });
  return _db;
}

export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop) {
    const target = getDb();
    const value = (target as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === "function") return value.bind(target);
    return value;
  },
});
