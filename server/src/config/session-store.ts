import pg from "pg";
import { env } from "./env.js";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";

// Create a PostgreSQL connection pool for session storage.
export const sessionPool = new pg.Pool({
  connectionString: env.APP_DATABASE_URL,
});

// Create the PostgreSQL session store.
const PgSessionStore = connectPgSimple(session);

export const sessionStore = new PgSessionStore({
  pool: sessionPool,
  schemaName: "public",
  tableName: "session",
  createTableIfMissing: false,
});