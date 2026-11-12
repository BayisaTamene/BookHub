
import "dotenv/config";
import { z } from "zod";

// Define the required environment variables and their validation rules.
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  PORT: z.coerce
    .number()
    .int()
    .min(1)
    .max(65535)
    .default(5000),
});

// Validate the environment variables.
const result = envSchema.safeParse(process.env);

// Stop the application if the configuration is invalid.
if (!result.success) {
  console.error("Invalid environment configuration:");
  console.error(result.error.flatten().fieldErrors);
  process.exit(1);
}

// Export the validated configuration.
export const env = result.data;
