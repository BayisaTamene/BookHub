
import type { RequestHandler } from "express";
import type { ZodType } from "zod";

// Defines which part of an HTTP request should be validated.
type RequestSource = "body" | "query" | "params";

export const validate = (
  schema: ZodType,
  source: RequestSource = "body",
): RequestHandler => {
  return (req, res, next) => {
    // Select the requested part of the incoming request.
    const input = req[source];

    const result = schema.safeParse(input);

    // Stop the request if validation fails.
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      res.status(400).json({
        success: false,
        message: "Validation failed.",
        errors,
      });

      return;
    }

    // Store parsed data so controllers can use validated values.
    res.locals.validated = {
      ...res.locals.validated,
      [source]: result.data,
    };

    // Preserve the existing behavior for validated request bodies.
    if (source === "body") {
      req.body = result.data;
    }

    // Continue to the next middleware or controller.
    next();
  };
};
