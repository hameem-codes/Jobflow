import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { healthRouter } from "./routes/health.js";
import { readyRouter } from "./routes/ready.js";
import { authRouter } from "./routes/auth.js";
import { jobsRouter } from "./routes/jobs.js";
import { webhooksRouter } from "./routes/webhooks.js";
import { cronRouter } from "./routes/cron.js";
import { copilotRouter } from "./routes/copilot.js";
import { applicationsRouter } from "./routes/applications.js";
import { resumesRouter } from "./routes/resumes.js";
import { lettersRouter } from "./routes/letters.js";
import { notificationsRouter } from "./routes/notifications.js";
import { profileRouter } from "./routes/profile.js";
import { validateCsrf } from "./middleware/csrf.js";
import { logger } from "./lib/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { ApiError } from "./lib/ApiError.js";
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    integrations: [
      nodeProfilingIntegration(),
    ],
    tracesSampleRate: 1.0, 
    profilesSampleRate: 1.0,
    environment: env.NODE_ENV,
  });
}

// The request handler must be the first middleware on the app
if (env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

// Security and utility middleware
app.use(helmet());
app.use(
  cors({
    origin: env.APP_ORIGIN,
    credentials: true, // Allow cookies
  })
);
app.use(cookieParser());

// Webhooks must be mounted before express.json() to preserve raw body for signature verification
app.use("/api/webhooks", express.raw({ type: "application/json" }), webhooksRouter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CSRF Protection (Global for API routes)
// Ensure it runs only for /api routes so static assets aren't blocked, or just apply it globally.
// We apply it globally for simplicity, it only checks state-changing methods.
app.use("/api", validateCsrf);

// Mount API routes
app.use("/api/auth", authRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/cron", cronRouter);
app.use("/api/copilot", copilotRouter);
app.use("/api/applications", applicationsRouter);
app.use("/api/resumes", resumesRouter);
app.use("/api/letters", lettersRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/profile", profileRouter);
app.use("/healthz", healthRouter);
app.use("/readyz", readyRouter);

// Handle unknown API routes (must be before SPA fallback)
app.use("/api/*", (_req, _res, next) => {
  next(ApiError.notFound("API route not found"));
});

// Serve static files from dist/public
const staticPath = fs.existsSync(path.resolve(__dirname, "public"))
  ? path.resolve(__dirname, "public")
  : path.resolve(process.cwd(), "dist", "public");

app.use(express.static(staticPath));

// SPA Fallback - serve index.html for all frontend routes
app.get("*", (_req, res) => {
  res.sendFile(path.join(staticPath, "index.html"));
});

// Centralized error handler
app.use(errorHandler);
