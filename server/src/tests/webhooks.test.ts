import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import { webhooksRouter } from "../routes/webhooks.js";
import { Receiver } from "@upstash/qstash";
import * as handlers from "../lib/jobs/handlers.js";

const { mockVerify } = vi.hoisted(() => ({
  mockVerify: vi.fn(),
}));

// Mock receiver
vi.mock("@upstash/qstash", () => {
  return {
    Receiver: class {
      verify = mockVerify;
    },
  };
});

// Mock handlers
vi.mock("../lib/jobs/handlers.js", () => ({
  jobSourcingRefreshHandler: vi.fn().mockResolvedValue(undefined),
  interviewReminderHandler: vi.fn().mockResolvedValue(undefined),
  weeklyDigestHandler: vi.fn().mockResolvedValue(undefined),
  resumeReparseHandler: vi.fn().mockResolvedValue(undefined),
}));

// Setup express app with the webhook router
const app = express();
// Same middleware as in app.ts
app.use("/api/webhooks", express.raw({ type: "application/json" }), webhooksRouter);
// Basic error handler
app.use((err: any, req: any, res: any, next: any) => {
  res.status(err.statusCode || 500).json({ error: err.message });
});

describe("QStash Webhooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reject if Upstash-Signature is missing", async () => {
    const res = await request(app)
      .post("/api/webhooks/qstash")
      .set("upstash-message-id", "msg-123")
      .send({ jobType: "job_sourcing_refresh" });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Missing Upstash-Signature/);
  });

  it("should reject if Upstash-Signature is invalid", async () => {
    // Override mock verify to return false
    mockVerify.mockResolvedValueOnce(false);

    const res = await request(app)
      .post("/api/webhooks/qstash")
      .set("upstash-signature", "invalid-sig")
      .set("upstash-message-id", "msg-123")
      .send({ jobType: "job_sourcing_refresh" });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Invalid Upstash signature/);
  });

  it("should accept valid signature and dispatch to job handler", async () => {
    mockVerify.mockResolvedValueOnce(true);

    const res = await request(app)
      .post("/api/webhooks/qstash")
      .set("upstash-signature", "valid-sig")
      .set("upstash-message-id", "msg-123")
      .send({ jobType: "job_sourcing_refresh" });

    expect(res.status).toBe(200);
    expect(handlers.jobSourcingRefreshHandler).toHaveBeenCalled();
  });
});
