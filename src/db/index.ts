import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

function createDb(): DrizzleDb {
  if (!process.env["DATABASE_URL"]) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  const sql = neon(process.env["DATABASE_URL"]);
  return drizzle(sql, { schema });
}

// Lazy singleton — only throws at request time, not at module evaluation during build
let _db: DrizzleDb | undefined;
export const db = new Proxy({} as DrizzleDb, {
  get(_target, prop) {
    if (!_db) {
      _db = createDb();
    }
    return (_db as unknown as Record<string | symbol, unknown>)[prop];
  },
});
