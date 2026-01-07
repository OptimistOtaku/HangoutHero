import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import * as schema from "@shared/schema";
import ws from "ws";

// Configure WebSocket for Neon serverless (needed for Node.js)
if (typeof WebSocket === "undefined") {
  neonConfig.webSocketConstructor = ws;
}

// Create a connection pool only if DATABASE_URL is set
let pool: Pool | null = null;
if (process.env.DATABASE_URL) {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
}

// Create Drizzle instance (will be null if no DATABASE_URL)
export const db = pool ? drizzle(pool, { schema }) : null;
