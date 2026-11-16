
import app from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";

async function startServer(): Promise<void> {
  try {
    // Establish the database connection.
    await prisma.$connect();

    console.log("Database connection established successfully.");

    // Start the Express server only after connecting to the database.
    app.listen(env.PORT, () => {
      console.log(
        `BookHub API is running in ${env.NODE_ENV} mode on port ${env.PORT}`
      );
    });
  } catch (error) {
    console.error("Failed to start BookHub API:", error);
    process.exit(1);
  }
}

void startServer();
