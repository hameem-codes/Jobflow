import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { copilotRateLimiter } from "../lib/rateLimit.js";
import { copilotService, CopilotMode } from "../services/copilot/copilot.service.js";
import { logger } from "../lib/logger.js";
import { ApiError } from "../lib/ApiError.js";

export const copilotRouter = Router();

// Copilot endpoint requires authentication
copilotRouter.use(requireAuth);

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(2000, "Historical message turn must not exceed 2000 characters"),
});

const copilotRequestSchema = z.object({
  message: z.string().min(1, "Message cannot be empty").max(1000, "Message must not exceed 1000 characters"),
  history: z.array(chatMessageSchema).max(10, "Conversation history cannot exceed 10 turns").optional().default([]),
  mode: z
    .enum(["general", "resume_feedback", "interview_prep", "cover_letter", "job_search", "application_tracking"])
    .optional()
    .default("general"),
  context: z.string().max(3000).optional(),
  jobId: z.string().max(100).optional(),
  applicationId: z.string().max(100).optional(),
});

copilotRouter.post(
  "/chat",
  validate({ body: copilotRequestSchema }),
  async (req, res, next) => {
    try {
      const userId = req.user?.jobflowId;
      if (!userId) {
        return next(ApiError.unauthorized("Authentication required"));
      }

      // 1. Rate Limiting per user identity
      const limitResult = await copilotRateLimiter.limit(userId);
      if (!limitResult.success) {
        logger.warn({ userId }, "Copilot rate limit exceeded");
        res.set("Retry-After", Math.ceil((limitResult.reset - Date.now()) / 1000).toString());
        return next(new ApiError(429, "RATE_LIMIT_EXCEEDED", "Too many requests. Please try again later."));
      }

      const { mode, message, history, jobId, applicationId } = req.body as z.infer<typeof copilotRequestSchema>;

      logger.info({ userId, mode, historyTurns: history?.length }, "Starting copilot stream");

      // 2. Call service to get Groq stream with grounded context and multi-turn memory
      const stream = await copilotService.streamChat({
        jobflowId: userId,
        message,
        history,
        mode: mode as CopilotMode,
        jobId,
        applicationId,
      });

      // 3. Set SSE Headers
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      // Prevent buffering from proxies like Nginx
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();

      // Handle client disconnect gracefully
      req.on("close", () => {
        logger.info({ userId }, "Client disconnected during copilot stream");
      });

      // 4. Stream output
      for await (const chunk of stream) {
        if (req.closed) break;
        const text = chunk.choices[0]?.delta?.content || "";
        if (text) {
          res.write(`data: ${JSON.stringify({ type: "token", text })}\n\n`);
        }
      }

      if (!req.closed) {
        res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
        res.end();
      }

      logger.info({ userId }, "Copilot stream completed successfully");
    } catch (error: any) {
      // If headers are already sent (we started streaming), emit an SSE error event
      if (res.headersSent) {
        logger.error({ err: error }, "Error occurred during active copilot stream");
        res.write(`data: ${JSON.stringify({ type: "error", message: "Stream interrupted due to an error" })}\n\n`);
        res.end();
      } else {
        next(error);
      }
    }
  }
);
