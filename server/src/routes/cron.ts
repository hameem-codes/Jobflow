import { Router, Request, Response } from "express";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { qstash } from "../lib/qstash.js";
import { ApiError } from "../lib/ApiError.js";

export const cronRouter = Router();

// Vercel Cron sends an Authorization header with a Bearer token matching CRON_SECRET if configured.
// Or we can just let QStash do the work by triggering a QStash publish.
cronRouter.get("/schedule", async (req: Request, res: Response, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (env.NODE_ENV === "production") {
      if (!authHeader || authHeader !== `Bearer ${env.CRON_SECRET || ""}`) {
        logger.warn("Unauthorized cron invocation attempt");
        throw new ApiError(401, "UNAUTHORIZED", "Unauthorized cron invocation attempt");
      }
    }

    if (!qstash) {
      throw new ApiError(500, "QSTASH_CONFIG_ERROR", "QStash client not initialized");
    }

    // Schedule background jobs
    logger.info({}, "Cron triggered: scheduling background jobs");

    // Enqueue job sourcing refresh
    const targetUrl = `${env.APP_ORIGIN}/api/webhooks/qstash`;

    await qstash.publishJSON({
      url: targetUrl,
      body: {
        jobType: "job_sourcing_refresh",
        timestamp: Date.now()
      },
      // You can also add retries, delays etc here
    });

    res.status(200).json({ success: true, message: "Jobs scheduled" });
  } catch (error) {
    next(error);
  }
});
