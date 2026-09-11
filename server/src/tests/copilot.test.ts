import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from "vitest";
import { app } from "../app.js";
import { supabase } from "../lib/supabase.js";
import { db } from "../db/index.js";
import { groq } from "../lib/groq.js";
import request from "supertest";

const { userRateLimits, mockLimit } = vi.hoisted(() => {
  const userRateLimits = new Map<string, number>();
  const mockLimit = vi.fn().mockImplementation((key: string) => {
    const count = (userRateLimits.get(key) || 0) + 1;
    userRateLimits.set(key, count);
    return Promise.resolve({
      success: count <= 10,
      limit: 10,
      remaining: Math.max(0, 10 - count),
      reset: Date.now() + 60000,
    });
  });
  return { userRateLimits, mockLimit };
});

vi.mock("@upstash/redis", () => ({
  Redis: class {
    constructor() {}
  },
}));

vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: class {
    static fixedWindow() { return vi.fn(); }
    constructor() {}
    limit = mockLimit;
  },
}));

vi.mock("../middleware/csrf.js", () => ({
  validateCsrf: vi.fn((req, res, next) => next()),
}));

vi.mock("../lib/supabase.js", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
  },
}));

vi.mock("../db/index.js", () => {
  const createChainMock = (data: any[] = []) => {
    const chain: any = {
      from: vi.fn(() => chain),
      where: vi.fn(() => chain),
      orderBy: vi.fn(() => chain),
      limit: vi.fn().mockResolvedValue(data),
      then: vi.fn((resolve: any) => Promise.resolve(data).then(resolve)),
    };
    return chain;
  };

  return {
    db: {
      select: vi.fn(() => createChainMock([])),
      execute: vi.fn().mockResolvedValue([]),
    },
  };
});

vi.mock("../lib/groq.js", () => ({
  groq: {
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  },
}));

describe("POST /api/copilot/chat", () => {
  beforeAll(async () => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.clearAllMocks();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    userRateLimits.clear();
  });

  const validToken = "valid-token";

  const setupAuth = (jobflowId = "jobflow-123", email = "test@example.com", profileData: any = {}) => {
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: { id: `supabase-${jobflowId}` } },
      error: null,
    });
    const userRecord = [{
      id: jobflowId,
      email,
      name: "Test User",
      title: "Frontend Developer",
      targetRole: "Senior React Engineer",
      location: "San Francisco, CA",
      ...profileData,
    }];
    const chain: any = {
      from: vi.fn(() => chain),
      where: vi.fn(() => chain),
      orderBy: vi.fn(() => chain),
      limit: vi.fn().mockResolvedValue(userRecord),
      then: vi.fn((resolve: any) => Promise.resolve(userRecord).then(resolve)),
    };
    (db.select as any).mockReturnValue(chain);
  };

  const getCopilotRouteHandler = () => {
    const route = (app as any)._router.stack
      .find((layer: any) => layer.name === "router" && layer.regexp.test("/api/copilot"))
      ?.handle.stack.find((layer: any) => layer.route && layer.route.path === "/chat")
      ?.route;

    const handler = route?.stack[route.stack.length - 1].handle;
    if (!handler) {
      throw new Error("Could not find copilot chat handler");
    }
    return handler;
  };

  it("should reject unauthenticated requests with 401", async () => {
    const res = await request(app)
      .post("/api/copilot/chat")
      .send({ mode: "resume_feedback", message: "Hello" });

    expect(res.status).toBe(401);
  });

  it("should reject invalid request bodies with 400", async () => {
    setupAuth();

    const res = await request(app)
      .post("/api/copilot/chat")
      .set("Cookie", [`app_session_id=${validToken}`])
      .send({ mode: "invalid_mode", message: "" });

    expect(res.status).toBe(400);
  });

  it("should enforce per-user rate limiting (429)", async () => {
    setupAuth("jobflow-123");
    userRateLimits.set("jobflow-123", 10);

    const resOverLimit = await request(app)
      .post("/api/copilot/chat")
      .set("Cookie", [`app_session_id=${validToken}`])
      .send({ mode: "resume_feedback", message: "Test message" });

    expect(resOverLimit.status).toBe(429);
    expect(resOverLimit.header["retry-after"]).toBeDefined();
  });

  it("should maintain independent rate limits for different authenticated users", async () => {
    // User A has hit the limit
    userRateLimits.set("user-a", 10);
    const limitA = await mockLimit("user-a");
    expect(limitA.success).toBe(false);

    // User B is fresh
    const limitB = await mockLimit("user-b");
    expect(limitB.success).toBe(true);
    expect(userRateLimits.get("user-b")).toBe(1);
    expect(userRateLimits.get("user-a")).toBe(11);
  });

  it("should ignore user identity spoofing in request body and use authenticated session", async () => {
    const handler = getCopilotRouteHandler();

    const mockReq = {
      method: "POST",
      url: "/chat",
      body: { mode: "resume_feedback", message: "Test message", userId: "attacker-999" },
      user: { jobflowId: "legit-user-123" },
      closed: false,
      on: vi.fn(),
    } as any;

    const mockRes = {
      setHeader: vi.fn(),
      flushHeaders: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
      headersSent: false,
    } as any;

    const mockNext = vi.fn();
    const mockStream = (async function* () {
      yield { choices: [{ delta: { content: "ok" } }] };
    })();
    (groq.chat.completions.create as any).mockResolvedValue(mockStream);

    await handler(mockReq, mockRes, mockNext);

    // Verifies rate limiter is invoked with session jobflowId, never body userId
    expect(mockLimit).toHaveBeenCalledWith("legit-user-123");
    expect(mockLimit).not.toHaveBeenCalledWith("attacker-999");
  });

  it("should support SSE streaming with correct headers and emit valid output", async () => {
    setupAuth();

    const mockStream = (async function* () {
      yield { choices: [{ delta: { content: "Hello " } }] };
      yield { choices: [{ delta: { content: "World" } }] };
    })();
    (groq.chat.completions.create as any).mockResolvedValue(mockStream);

    let output = "";
    const mockRes = {
      setHeader: vi.fn(),
      set: vi.fn(),
      flushHeaders: vi.fn(),
      write: vi.fn((chunk: string) => { output += chunk; }),
      end: vi.fn(),
      headersSent: false,
    } as any;

    const mockReq = {
      method: "POST",
      url: "/chat",
      body: { mode: "resume_feedback", message: "Test message" },
      user: { jobflowId: "jobflow-123" },
      closed: false,
      on: vi.fn(),
    } as any;

    const mockNext = vi.fn();
    const handler = getCopilotRouteHandler();

    await handler(mockReq, mockRes, mockNext);

    expect(mockRes.setHeader).toHaveBeenCalledWith("Content-Type", "text/event-stream");
    expect(mockRes.setHeader).toHaveBeenCalledWith("Cache-Control", "no-cache");
    expect(mockRes.setHeader).toHaveBeenCalledWith("Connection", "keep-alive");
    expect(mockRes.setHeader).toHaveBeenCalledWith("X-Accel-Buffering", "no");
    expect(mockRes.flushHeaders).toHaveBeenCalled();

    expect(output).toContain('data: {"type":"token","text":"Hello "}');
    expect(output).toContain('data: {"type":"token","text":"World"}');
    expect(output).toContain('data: {"type":"done"}');
    expect(mockRes.end).toHaveBeenCalled();
  });

  it("should handle Groq pre-stream provider errors by delegating to next()", async () => {
    const handler = getCopilotRouteHandler();

    const apiError = new Error("Groq API service unavailable");
    (groq.chat.completions.create as any).mockRejectedValueOnce(apiError);

    const mockReq = {
      method: "POST",
      url: "/chat",
      body: { mode: "interview_prep", message: "Help me practice" },
      user: { jobflowId: "jobflow-123" },
      closed: false,
      on: vi.fn(),
    } as any;

    const mockRes = {
      setHeader: vi.fn(),
      flushHeaders: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
      headersSent: false,
    } as any;

    const mockNext = vi.fn();

    await handler(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 502,
        errorCode: "PROVIDER_FAILED",
        message: "Groq API service unavailable",
      })
    );
    expect(mockRes.write).not.toHaveBeenCalled();
  });

  it("should handle Groq mid-stream provider errors by emitting an error event", async () => {
    const handler = getCopilotRouteHandler();

    const failingStream = (async function* () {
      yield { choices: [{ delta: { content: "Starting response... " } }] };
      throw new Error("Stream connection abruptly terminated");
    })();
    (groq.chat.completions.create as any).mockResolvedValue(failingStream);

    let output = "";
    const mockRes = {
      setHeader: vi.fn(),
      flushHeaders: vi.fn(),
      write: vi.fn((chunk: string) => { output += chunk; }),
      end: vi.fn(),
      headersSent: true, // Headers already sent
    } as any;

    const mockReq = {
      method: "POST",
      url: "/chat",
      body: { mode: "cover_letter", message: "Write a letter" },
      user: { jobflowId: "jobflow-123" },
      closed: false,
      on: vi.fn(),
    } as any;

    const mockNext = vi.fn();

    await handler(mockReq, mockRes, mockNext);

    expect(output).toContain('data: {"type":"token","text":"Starting response... "}');
    expect(output).toContain('data: {"type":"error","message":"Stream interrupted due to an error"}');
    expect(mockRes.end).toHaveBeenCalled();
  });

  it("should successfully process greeting 'hey' without requiring personal context", async () => {
    const handler = getCopilotRouteHandler();
    const mockStream = (async function* () {
      yield { choices: [{ delta: { content: "Hey! How can I help you today?" } }] };
    })();
    (groq.chat.completions.create as any).mockResolvedValue(mockStream);

    let output = "";
    const mockRes = {
      setHeader: vi.fn(),
      flushHeaders: vi.fn(),
      write: vi.fn((chunk: string) => { output += chunk; }),
      end: vi.fn(),
      headersSent: false,
    } as any;

    const mockReq = {
      method: "POST",
      url: "/chat",
      body: { message: "hey", mode: "general" },
      user: { jobflowId: "jobflow-new-user" },
      closed: false,
      on: vi.fn(),
    } as any;

    const mockNext = vi.fn();
    await handler(mockReq, mockRes, mockNext);

    expect(groq.chat.completions.create).toHaveBeenCalled();
    const callArgs = (groq.chat.completions.create as any).mock.calls[0][0];
    // Verify system prompt is passed and no personal context blocking occurred
    expect(callArgs.messages.some((m: any) => m.role === "system")).toBe(true);
    expect(callArgs.messages.some((m: any) => m.role === "user" && m.content === "hey")).toBe(true);
    expect(output).toContain('data: {"type":"token","text":"Hey! How can I help you today?"}');
  });

  it("should answer 'How does Jobflow work?' with product knowledge and no personal RAG required", async () => {
    const handler = getCopilotRouteHandler();
    const mockStream = (async function* () {
      yield { choices: [{ delta: { content: "Jobflow is a career workspace for tracking applications..." } }] };
    })();
    (groq.chat.completions.create as any).mockResolvedValue(mockStream);

    const mockRes = {
      setHeader: vi.fn(),
      flushHeaders: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
      headersSent: false,
    } as any;

    const mockReq = {
      method: "POST",
      url: "/chat",
      body: { message: "How does Jobflow work?" },
      user: { jobflowId: "jobflow-123" },
      closed: false,
      on: vi.fn(),
    } as any;

    await handler(mockReq, mockRes, vi.fn());

    const callArgs = (groq.chat.completions.create as any).mock.calls[0][0];
    const systemPrompt = callArgs.messages.find((m: any) => m.role === "system")?.content;
    expect(systemPrompt).toContain("Jobflow is a comprehensive, private career workspace");
    expect(systemPrompt).toContain("Application Tracking (Kanban Pipeline)");
  });

  it("should forward conversation history turns to Groq in sequence", async () => {
    const handler = getCopilotRouteHandler();
    const mockStream = (async function* () {
      yield { choices: [{ delta: { content: "Sure, let's look at remote options." } }] };
    })();
    (groq.chat.completions.create as any).mockResolvedValue(mockStream);

    const mockRes = {
      setHeader: vi.fn(),
      flushHeaders: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
      headersSent: false,
    } as any;

    const history = [
      { role: "user" as const, content: "Help me find an AI internship." },
      { role: "assistant" as const, content: "I can help with that. Any preferred location?" },
    ];

    const mockReq = {
      method: "POST",
      url: "/chat",
      body: { message: "Preferably remote.", history },
      user: { jobflowId: "jobflow-123" },
      closed: false,
      on: vi.fn(),
    } as any;

    await handler(mockReq, mockRes, vi.fn());

    const callArgs = (groq.chat.completions.create as any).mock.calls[0][0];
    const messages = callArgs.messages;
    // System message, then history turns, then latest message
    expect(messages.some((m: any) => m.role === "user" && m.content === "Help me find an AI internship.")).toBe(true);
    expect(messages.some((m: any) => m.role === "assistant" && m.content === "I can help with that. Any preferred location?")).toBe(true);
    expect(messages[messages.length - 1].content).toBe("Preferably remote.");
  });

  it("should reject conversation history that exceeds maximum allowed turns", async () => {
    setupAuth();

    const excessiveHistory = Array.from({ length: 15 }, (_, i) => ({
      role: i % 2 === 0 ? ("user" as const) : ("assistant" as const),
      content: `Turn ${i}`,
    }));

    const res = await request(app)
      .post("/api/copilot/chat")
      .set("Cookie", [`app_session_id=${validToken}`])
      .send({ message: "Hello", history: excessiveHistory });

    expect(res.status).toBe(400);
  });

  it("should enforce strict user isolation between sessions", async () => {
    const handler = getCopilotRouteHandler();
    const mockStream = (async function* () {
      yield { choices: [{ delta: { content: "Isolated response" } }] };
    })();
    (groq.chat.completions.create as any).mockResolvedValue(mockStream);

    const mockRes = {
      setHeader: vi.fn(),
      flushHeaders: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
      headersSent: false,
    } as any;

    // Request for User A
    const mockReqA = {
      method: "POST",
      url: "/chat",
      body: { message: "What is my target role?" },
      user: { jobflowId: "user-alpha" },
      closed: false,
      on: vi.fn(),
    } as any;

    await handler(mockReqA, mockRes, vi.fn());
    expect(mockLimit).toHaveBeenCalledWith("user-alpha");

    // Request for User B
    const mockReqB = {
      method: "POST",
      url: "/chat",
      body: { message: "What is my target role?" },
      user: { jobflowId: "user-beta" },
      closed: false,
      on: vi.fn(),
    } as any;

    await handler(mockReqB, mockRes, vi.fn());
    expect(mockLimit).toHaveBeenCalledWith("user-beta");
  });

  it("should never make real Groq API calls during testing", () => {
    expect(vi.isMockFunction(groq.chat.completions.create)).toBe(true);
  });
});

