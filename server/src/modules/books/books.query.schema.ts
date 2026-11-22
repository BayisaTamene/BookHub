
import { z } from "zod";

export const booksQuerySchema = z.object({
  // Convert URL string values into positive integers.
  page: z.coerce.number().int().min(1).default(1),

  // Limit the number of records returned per request.
  limit: z.coerce.number().int().min(1).max(48).default(12),

  // Accept a category slug such as "computer-science".
  category: z
    .string()
    .trim()
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),

  // Search text is optional and limited in length.
  search: z.string().trim().max(100).optional(),
});
