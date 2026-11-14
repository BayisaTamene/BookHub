
import type { RequestHandler } from "express";
import type { ZodType } from "zod";

export const validate = (schema: ZodType): RequestHandler => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

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

    // Replace the request body with validated data.
    req.body = result.data;

    // Continue to the next middleware or controller.
    next();
  };
};
