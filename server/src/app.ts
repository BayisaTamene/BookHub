
import express from "express";

const app = express();

// Parse incoming JSON request bodies.
app.use(express.json());

// Basic health-check endpoint.
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "BookHub API is running successfully.",
  });
});

export default app;
