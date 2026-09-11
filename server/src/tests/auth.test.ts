import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { requireAuth } from "../middleware/auth.js";
import { supabase } from "../lib/supabase.js";
import { db } from "../db/index.js";
import { users } from "../db/schema/users.js";
import { eq } from "drizzle-orm";
import { ApiError } from "../lib/ApiError.js";
import { COOKIE_NAME } from "@shared/const.js";

import request from "supertest";
import { app } from "../app.js";

// Mock Supabase
vi.mock("../lib/supabase.js", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
  },
}));

describe("Auth Middleware - Profile Synchronization", () => {
  const mockToken = "valid-jwt";
  const mockSupabaseUser = {
    id: "test-user-uuid",
    email: "test@example.com",
    user_metadata: { name: "Test User" },
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    // Clear DB
    await db.delete(users).where(eq(users.id, mockSupabaseUser.id));
  });

  afterEach(async () => {
    await db.delete(users).where(eq(users.id, mockSupabaseUser.id));
  });

  it("rejects when no cookie is present", async () => {
    const req = { cookies: {} } as any;
    const res = {} as any;
    const next = vi.fn();

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next.mock.calls[0][0].message).toBe("Authentication required");
  });

  it("provisions a missing user profile automatically on first request", async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    } as any);

    const req = { cookies: { [COOKIE_NAME]: mockToken } } as any;
    const res = {} as any;
    const next = vi.fn();

    // Verify user doesn't exist
    const [before] = await db.select().from(users).where(eq(users.id, mockSupabaseUser.id));
    expect(before).toBeUndefined();

    // Call middleware
    await requireAuth(req, res, next);

    // Verify it succeeded and populated req.user
    expect(next).toHaveBeenCalledWith(); // called without error
    expect(req.user).toBeDefined();
    expect(req.user.supabaseId).toBe(mockSupabaseUser.id);
    expect(req.user.jobflowId).toBe(mockSupabaseUser.id);
    expect(req.user.email).toBe(mockSupabaseUser.email);

    // Verify user was inserted into DB
    const [after] = await db.select().from(users).where(eq(users.id, mockSupabaseUser.id));
    expect(after).toBeDefined();
    expect(after.name).toBe("Test User");
    expect(after.email).toBe("test@example.com");
  });

  it("reuses an existing user profile", async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    } as any);

    // Seed user
    await db.insert(users).values({
      id: mockSupabaseUser.id,
      name: "Existing Name",
      email: "old@example.com",
    });

    const req = { cookies: { [COOKIE_NAME]: mockToken } } as any;
    const res = {} as any;
    const next = vi.fn();

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.user).toBeDefined();
    expect(req.user.supabaseId).toBe(mockSupabaseUser.id);
    
    const [after] = await db.select().from(users).where(eq(users.id, mockSupabaseUser.id));
    expect(after.name).toBe("Existing Name");
  });

  it("prevents duplicate user creation on concurrent requests (idempotent provisioning)", async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    } as any);

    const req1 = { cookies: { [COOKIE_NAME]: mockToken } } as any;
    const req2 = { cookies: { [COOKIE_NAME]: mockToken } } as any;
    const next1 = vi.fn();
    const next2 = vi.fn();

    // Call concurrently
    await Promise.all([
      requireAuth(req1, {} as any, next1),
      requireAuth(req2, {} as any, next2),
    ]);

    expect(next1).toHaveBeenCalledWith();
    expect(next2).toHaveBeenCalledWith();

    const allUsers = await db.select().from(users).where(eq(users.id, mockSupabaseUser.id));
    expect(allUsers.length).toBe(1);
    expect(allUsers[0].id).toBe(mockSupabaseUser.id);
  });
});

describe("Auth Routes & Profile Management", () => {
  const userA = {
    id: "user-a-uuid",
    email: "userA@example.com",
    user_metadata: { name: "User Alpha" },
  };

  const userB = {
    id: "user-b-uuid",
    email: "userB@example.com",
    user_metadata: { name: "User Beta" },
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    await db.delete(users).where(eq(users.id, userA.id));
    await db.delete(users).where(eq(users.id, userB.id));
  });

  afterEach(async () => {
    await db.delete(users).where(eq(users.id, userA.id));
    await db.delete(users).where(eq(users.id, userB.id));
  });

  it("GET /api/auth/me returns 401 when unauthenticated", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("GET /api/auth/me returns authenticated user's real profile with supabaseId", async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: userA },
      error: null,
    } as any);

    // Pre-insert with specific profile
    await db.insert(users).values({
      id: userA.id,
      name: "User Alpha",
      email: userA.email,
      title: "Senior Product Designer",
      targetRole: "Lead Product Designer",
      locationPreference: "Remote - US",
    });

    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", [`${COOKIE_NAME}=token-user-a`]);

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.id).toBe(userA.id);
    expect(res.body.user.supabaseId).toBe(userA.id);
    expect(res.body.user.name).toBe("User Alpha");
    expect(res.body.user.title).toBe("Senior Product Designer");
    expect(res.body.user.targetRole).toBe("Lead Product Designer");
    expect(res.body.user.locationPreference).toBe("Remote - US");
  });

  it("PUT /api/auth/me updates profile fields in PostgreSQL", async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: userA },
      error: null,
    } as any);

    await db.insert(users).values({
      id: userA.id,
      name: "User Alpha",
      email: userA.email,
    });

    const res = await request(app)
      .put("/api/auth/me")
      .set("Cookie", [`${COOKIE_NAME}=token-user-a`, "csrf-token=test-csrf-token"])
      .set("x-csrf-token", "test-csrf-token")
      .send({
        name: "Alpha Updated",
        title: "Staff Engineer",
        locationPreference: "Hybrid - London",
        targetRole: "Principal Engineer",
      });

    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe("Alpha Updated");
    expect(res.body.user.title).toBe("Staff Engineer");
    expect(res.body.user.locationPreference).toBe("Hybrid - London");
    expect(res.body.user.targetRole).toBe("Principal Engineer");

    // Verify DB
    const [dbRow] = await db.select().from(users).where(eq(users.id, userA.id));
    expect(dbRow.name).toBe("Alpha Updated");
    expect(dbRow.title).toBe("Staff Engineer");
    expect(dbRow.targetRole).toBe("Principal Engineer");
    expect(dbRow.locationPreference).toBe("Hybrid - London");
  });

  it("enforces strict user isolation between User A and User B", async () => {
    // Seed both users
    await db.insert(users).values({
      id: userA.id,
      name: "Alpha Private",
      email: userA.email,
      title: "Secret Designer",
    });

    await db.insert(users).values({
      id: userB.id,
      name: "Beta Private",
      email: userB.email,
      title: "Secret Developer",
    });

    // Request as User A
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: userA },
      error: null,
    } as any);

    const resA = await request(app)
      .get("/api/auth/me")
      .set("Cookie", [`${COOKIE_NAME}=token-user-a`]);

    expect(resA.status).toBe(200);
    expect(resA.body.user.id).toBe(userA.id);
    expect(resA.body.user.name).toBe("Alpha Private");

    // Request as User B
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: userB },
      error: null,
    } as any);

    const resB = await request(app)
      .get("/api/auth/me")
      .set("Cookie", [`${COOKIE_NAME}=token-user-b`]);

    expect(resB.status).toBe(200);
    expect(resB.body.user.id).toBe(userB.id);
    expect(resB.body.user.name).toBe("Beta Private");

    // Ensure User A cannot modify User B (server uses req.user.jobflowId strictly from token)
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: userA },
      error: null,
    } as any);

    await request(app)
      .put("/api/auth/me")
      .set("Cookie", [`${COOKIE_NAME}=token-user-a`, "csrf-token=test-csrf-token"])
      .set("x-csrf-token", "test-csrf-token")
      .send({ name: "Hacked Alpha" });

    // Verify User B's row in DB remains unchanged
    const [checkB] = await db.select().from(users).where(eq(users.id, userB.id));
    expect(checkB.name).toBe("Beta Private");
  });

  it("POST /api/auth/logout clears auth and CSRF cookies", async () => {
    const res = await request(app).post("/api/auth/logout");
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Logged out successfully");

    const setCookies = res.headers["set-cookie"] || [];
    const clearedSession = setCookies.some((c: string) => c.includes(`${COOKIE_NAME}=;`));
    const clearedCsrf = setCookies.some((c: string) => c.includes("csrf-token=;"));
    expect(clearedSession).toBe(true);
    expect(clearedCsrf).toBe(true);
  });
});

