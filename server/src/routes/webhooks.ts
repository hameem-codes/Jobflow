import { Router, Request, Response } from "express";
import { verifySignatureEdge } from "@upstash/qstash/dist/nextjs"; // Or we can use the express middleware, but they recommend receiver
import { Receiver } from "@upstash/qstash";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { ApiError } from "../lib/ApiError.js";
import { 
  jobSourcingRefreshHandler, 
  interviewReminderHandler, 
  weeklyDigestHandler, 
  resumeReparseHandler 
} from "../lib/jobs/handlers.js";

export const webhooksRouter = Router();

// Only initialize receiver if keys are present
const receiver = (env.QSTASH_CURRENT_SIGNING_KEY && env.QSTASH_NEXT_SIGNING_KEY) 
  ? new Receiver({
      currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY,
      nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY,
    }) 
  : null;

// The webhook endpoint for QStash
webhooksRouter.post(
  "/qstash",
  async (req: Request, res: Response, next) => {
    try {
      // 1. Verify signature
      if (!receiver) {
        throw new ApiError(500, "QSTASH_CONFIG_ERROR", "QStash receiver not configured");
      }

      const signature = req.headers["upstash-signature"] as string;
      if (!signature) {
        throw new ApiError(401, "UNAUTHORIZED", "Missing Upstash-Signature header");
      }

      // Ensure we have the raw body. Express must be configured with express.raw({ type: "application/json" }) for this route
      // If req.body is already an object, the raw body wasn't preserved, causing signature failure.
      // So in app.ts we'll make sure this route gets raw body.
      const rawBody = req.body;
      
      let bodyString = typeof rawBody === "string" ? rawBody : (Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : JSON.stringify(rawBody));

      const isValid = await receiver.verify({
        signature,
        body: bodyString,
      });

      if (!isValid) {
        throw new ApiError(401, "UNAUTHORIZED", "Invalid Upstash signature");
      }

      // 2. Parse payload and metadata
      // QStash adds Message-Id header
      const messageId = req.headers["upstash-message-id"] as string;
      if (!messageId) {
        throw new ApiError(400, "BAD_REQUEST", "Missing upstash-message-id header");
      }

      const payload = typeof rawBody === "string" || Buffer.isBuffer(rawBody) ? JSON.parse(bodyString) : rawBody;
      const jobType = payload?.jobType || req.headers["upstash-subject"] || "unknown";

      // The messageId is an excellent idempotent key provided by QStash
      const idempotencyKey = `${jobType}-${messageId}`;

      // 3. Dispatch to handlers
      switch (jobType) {
        case "job_sourcing_refresh":
          await jobSourcingRefreshHandler(payload, idempotencyKey);
          break;
        case "interview_reminder":
          await interviewReminderHandler(payload, idempotencyKey);
          break;
        case "weekly_digest":
          await weeklyDigestHandler(payload, idempotencyKey);
          break;
        case "resume_reparse":
          await resumeReparseHandler(payload, idempotencyKey);
          break;
        default:
          logger.warn({ jobType }, "Unknown job type received from QStash");
          // Returning 200 so QStash doesn't retry unknown jobs indefinitely
          break;
      }

      res.status(200).json({ success: true });
    } catch (err: any) {
      if (err instanceof ApiError) {
        next(err);
      } else if (err.name === "SignatureError" || (err.message && err.message.includes("Invalid Compact JWS"))) {
        // Upstash SDK throws SignatureError for invalid signatures
        next(new ApiError(401, "UNAUTHORIZED", "Invalid Upstash signature: " + err.message));
      } else {
        // Let Express error handler format it, QStash will see 500 and retry
        logger.error({ err }, "Unhandled error in QStash webhook");
        next(new ApiError(500, "INTERNAL_ERROR", "Internal Server Error in Background Job", [err instanceof Error ? err.message : String(err)]));
      }
    }
  }
);
