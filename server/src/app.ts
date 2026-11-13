
import express from "express";
import healthRouter from "./modules/health/health.routes.js";
import notFoundHandler from "./middleware/not-found.middleware.js";
import errorHandler from "./middleware/error.middleware.js";

const app = express();

// Parse incoming JSON request bodies.
app.use(express.json());

// Register application routes.
app.use("/api/health", healthRouter);

// Handle requests that don't match any registered route.
app.use(notFoundHandler);

// Handle all forwarded errors centrally.
app.use(errorHandler);

export default app;
