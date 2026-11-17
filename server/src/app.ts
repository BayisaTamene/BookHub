
import express from "express";
import healthRouter from "./modules/health/health.routes.js";
import notFoundHandler from "./middleware/not-found.middleware.js";
import errorHandler from "./middleware/error.middleware.js";
import { categoriesRouter } from "./modules/categories/categories.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import session from "express-session";
import { env } from "./config/env.js";
import { sessionStore } from "./config/session-store.js";

const app = express();

// Parse incoming JSON request bodies.
app.use(express.json());
// Configure server-managed sessions.
app.use(
  session({
    store: sessionStore,
    name: "bookhub.sid",
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);

// Register application routes.
app.use("/api/health", healthRouter);

app.use("/api/categories", categoriesRouter);

app.use("/api/auth", authRouter);

// Handle requests that don't match any registered route.
app.use(notFoundHandler);

// Handle all forwarded errors centrally.
app.use(errorHandler);

export default app;
