
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

export const bookIdSchema = z.object({
  id: z.uuid(),
});


const optionalBookString = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === ""
      ? undefined
      : value,
  z.string().trim().optional(),
);

// Validate metadata submitted with a book upload.
export const bookCreateSchema = z.object({
  title: z.string().trim().min(1).max(255),

  categoryId: z.uuid(),

  description: optionalBookString,

  isbn: optionalBookString.pipe(
    z.string().max(20).optional(),
  ),

  authorIds: z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;

      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    },
    z.array(z.uuid()).optional(),
  ),
});

