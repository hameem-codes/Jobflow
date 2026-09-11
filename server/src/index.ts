import { createServer } from "http";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { db } from "./db/index.js"; // In case we want to close DB later, but not strictly needed for this. Drizzle client usually doesn't need explicit close unless it's a specific pool. We won't worry about DB closing if not standard. 

const server = createServer(app);

server.listen(env.PORT, () => {
  logger.info(`Server running on http://localhost:${env.PORT}`);
});

// Process-level Error Handling & Graceful Shutdown

const gracefulShutdown = (signal: string) => {
  logger.info({ signal }, `Received ${signal}, shutting down gracefully...`);
  server.close(() => {
    logger.info("HTTP server closed.");
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error("Could not close connections in time, forcefully shutting down");
    process.exit(1);
  }, 10000).unref();
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("unhandledRejection", (reason, promise) => {
  logger.error({ reason, promise }, "Unhandled Rejection at process level");
  // Don't crash immediately for rejections, but log them properly
});

process.on("uncaughtException", (error) => {
  logger.fatal({ err: error }, "Uncaught Exception at process level");
  // Uncaught exceptions indicate an unstable state, process MUST exit.
  process.exit(1);
});
