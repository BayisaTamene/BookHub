import express from "express";
import healthRouter from "./modules/health/health.routes.js";

const app = express();

// Parse incoming JSON request bodies.
app.use(express.json());

// Register application routes.
app.use("/api/health", healthRouter);

export default app;