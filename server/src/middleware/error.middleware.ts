
import type { ErrorRequestHandler } from "express";
import AppError from "../utils/app-error.js";

const errorHandler: ErrorRequestHandler = (
  err,
  _req,
  res,
  _next
) => {
  // Log the actual error for server-side debugging.
  console.error(err);

  // Handle errors intentionally created by our application.
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });

    return;
  }

  // Handle unexpected errors safely.
  res.status(500).json({
    success: false,
    message: "Internal server error.",
  });
};

export default errorHandler;
