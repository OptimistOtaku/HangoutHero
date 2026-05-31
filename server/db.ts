import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema.js";

const connectionString = process.env.DATABASE_URL;

let pool: pg.Pool | null = null;

if (connectionString) {
  pool = new pg.Pool({
    connectionString,
    // Add SSL support required for cloud hosted databases like Supabase or Neon
    ssl: connectionString.includes("localhost") || connectionString.includes("127.0.0.1")
      ? false
      : { rejectUnauthorized: false }
  });
}

// Export the Drizzle connection instance
export const db = pool ? drizzle(pool, { schema }) : null;
