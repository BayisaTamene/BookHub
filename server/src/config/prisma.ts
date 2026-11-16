import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { env } from "./env.js";

// Create the PostgreSQL adapter.
const adapter = new PrismaPg({
  connectionString: env.APP_DATABASE_URL,
});

// Create one reusable Prisma client.
export const prisma = new PrismaClient({
  adapter,
});

