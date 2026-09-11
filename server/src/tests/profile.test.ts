import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { app } from "../app.js";
import { supabase } from "../lib/supabase.js";
import { db } from "../db/index.js";
import { users } from "../db/schema/users.js";
import { profiles } from "../db/schema/profiles.js";
import { eq } from "drizzle-orm";
import { COOKIE_NAME } from "@shared/const.js";

// Mock Supabase Auth
vi.mock("../lib/supabase.js", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
  },
}));

describe("Real Profile API & User Isolation", () => {
  const userA_Id = "test-user-a-uuid";
  const userA_Email = "user-a@example.com";
  const userA_Token = "token-user-a";

  const userB_Id = "test-user-b-uuid";
  const userB_Email = "user-b@example.com";
  const userB_Token = "token-user-b";

  beforeEach(async () => {
    vi.clearAllMocks();

    // Clean test records
    await db.delete(profiles).where(eq(profiles.userId, userA_Id));
    await db.delete(profiles).where(eq(profiles.userId, userB_Id));
    await db.delete(users).where(eq(users.id, userA_Id));
    await db.delete(users).where(eq(users.id, userB_Id));

    // Seed test users
    await db.insert(users).values([
      { id: userA_Id, email: userA_Email, name: "User Alpha" },
      { id: userB_Id, email: userB_Email, name: "User Beta" },
    ]);

    // Setup mock supabase return based on token
    vi.mocked(supabase.auth.getUser).mockImplementation(async (jwt: string) => {
      if (jwt === userA_Token) {
        return {
          data: { user: { id: userA_Id, email: userA_Email, user_metadata: { name: "User Alpha" } } },
          error: null,
        } as any;
      }
      if (jwt === userB_Token) {
        return {
          data: { user: { id: userB_Id, email: userB_Email, user_metadata: { name: "User Beta" } } },
          error: null,
        } as any;
      }
      return { data: { user: null }, error: new Error("Invalid token") } as any;
    });
  });

  afterEach(async () => {
    await db.delete(profiles).where(eq(profiles.userId, userA_Id));
    await db.delete(profiles).where(eq(profiles.userId, userB_Id));
    await db.delete(users).where(eq(users.id, userA_Id));
    await db.delete(users).where(eq(users.id, userB_Id));
  });

  const csrfCookie = "csrf-token=test-csrf";
  const csrfHeader = "test-csrf";

  it("requires authentication for profile endpoints", async () => {
    const res = await request(app).get("/api/profile");
    expect(res.status).toBe(401);
  });

  it("creates and retrieves an authenticated user profile", async () => {
    const patchRes = await request(app)
      .patch("/api/profile")
      .set("Cookie", [`${COOKIE_NAME}=${userA_Token}`, csrfCookie])
      .set("x-csrf-token", csrfHeader)
      .send({
        name: "Alpha Engineer",
        headline: "Senior Systems Architect",
        targetRoles: ["Staff Engineer", "Solutions Architect"],
        preferredLocations: ["San Francisco", "Remote"],
        remotePreference: true,
        skills: ["TypeScript", "PostgreSQL", "Node.js", "Distributed Systems"],
        githubUrl: "https://github.com/alpha",
      });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.profile).toBeDefined();
    expect(patchRes.body.profile.name).toBe("Alpha Engineer");
    expect(patchRes.body.profile.targetRoles).toContain("Staff Engineer");
    expect(patchRes.body.profile.skills).toContain("PostgreSQL");

    const getRes = await request(app)
      .get("/api/profile")
      .set("Cookie", [`${COOKIE_NAME}=${userA_Token}`]);

    expect(getRes.status).toBe(200);
    expect(getRes.body.profile.name).toBe("Alpha Engineer");
    expect(getRes.body.profile.headline).toBe("Senior Systems Architect");
    expect(getRes.body.profile.githubUrl).toBe("https://github.com/alpha");
  });

  it("enforces strict user isolation (User B cannot view or modify User A profile)", async () => {
    // User A sets profile
    const patchResA = await request(app)
      .patch("/api/profile")
      .set("Cookie", [`${COOKIE_NAME}=${userA_Token}`, csrfCookie])
      .set("x-csrf-token", csrfHeader)
      .send({
        name: "Private Alpha Profile",
        targetRoles: ["Confidential Role"],
        preferredLocations: ["Zurich"],
        skills: ["Rust", "Cryptography"],
      });
    expect(patchResA.status).toBe(200);

    // User B fetches their own profile - should NOT see User A's data
    const resB = await request(app)
      .get("/api/profile")
      .set("Cookie", [`${COOKIE_NAME}=${userB_Token}`]);

    expect(resB.status).toBe(200);
    expect(resB.body.profile.name).toBe("User Beta");
    expect(resB.body.profile.targetRoles).toEqual([]);
    expect(resB.body.profile.skills).toEqual([]);

    // User B updates their preferences
    const patchResB = await request(app)
      .patch("/api/profile/preferences")
      .set("Cookie", [`${COOKIE_NAME}=${userB_Token}`, csrfCookie])
      .set("x-csrf-token", csrfHeader)
      .send({
        targetRoles: ["Beta Specialist"],
        preferredLocations: ["London"],
        remotePreference: false,
      });
    expect(patchResB.status).toBe(200);

    // User A's preferences remain intact
    const resA = await request(app)
      .get("/api/profile/preferences")
      .set("Cookie", [`${COOKIE_NAME}=${userA_Token}`]);

    expect(resA.status).toBe(200);
    expect(resA.body.preferences.targetRoles).toEqual(["Confidential Role"]);
    expect(resA.body.preferences.preferredLocations).toEqual(["Zurich"]);
  });

  it("allows partial profile updates without wiping existing fields", async () => {
    // Initial profile
    const initRes = await request(app)
      .patch("/api/profile")
      .set("Cookie", [`${COOKIE_NAME}=${userA_Token}`, csrfCookie])
      .set("x-csrf-token", csrfHeader)
      .send({
        name: "Original Name",
        headline: "Initial Headline",
        targetRoles: ["Frontend Developer"],
        skills: ["React"],
      });
    expect(initRes.status).toBe(200);

    // Partial update: only update skills
    const patchRes = await request(app)
      .patch("/api/profile")
      .set("Cookie", [`${COOKIE_NAME}=${userA_Token}`, csrfCookie])
      .set("x-csrf-token", csrfHeader)
      .send({
        skills: ["React", "Vue", "TypeScript"],
      });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.profile.headline).toBe("Initial Headline");
    expect(patchRes.body.profile.targetRoles).toEqual(["Frontend Developer"]);
    expect(patchRes.body.profile.skills).toEqual(["React", "Vue", "TypeScript"]);
  });

  it("validates invalid inputs cleanly without throwing unhandled errors", async () => {
    const invalidUrlRes = await request(app)
      .patch("/api/profile")
      .set("Cookie", [`${COOKIE_NAME}=${userA_Token}`, csrfCookie])
      .set("x-csrf-token", csrfHeader)
      .send({
        githubUrl: "not-a-valid-url",
      });

    expect(invalidUrlRes.status).toBe(400);
    expect(invalidUrlRes.body.error).toBeDefined();
  });

  it("calculates real profile completeness from actual persisted fields", async () => {
    // Blank profile completeness
    const resEmpty = await request(app)
      .get("/api/profile/completeness")
      .set("Cookie", [`${COOKIE_NAME}=${userA_Token}`]);

    expect(resEmpty.status).toBe(200);
    expect(resEmpty.body.completeness.percentage).toBeLessThan(50);
    expect(resEmpty.body.completeness.missingItems).toContain("At least one target role");
    expect(resEmpty.body.completeness.missingItems).toContain("Add at least 3 professional skills");

    // Populate fields
    const updateRes = await request(app)
      .patch("/api/profile")
      .set("Cookie", [`${COOKIE_NAME}=${userA_Token}`, csrfCookie])
      .set("x-csrf-token", csrfHeader)
      .send({
        headline: "Full Stack Engineer",
        about: "Passionate developer with 5 years experience.",
        location: "Bengaluru",
        targetRoles: ["Full Stack Engineer"],
        preferredLocations: ["Bengaluru", "Remote"],
        skills: ["Node.js", "React", "PostgreSQL"],
        githubUrl: "https://github.com/developer",
        linkedinUrl: "https://linkedin.com/in/developer",
      });
    expect(updateRes.status).toBe(200);

    const resUpdated = await request(app)
      .get("/api/profile/completeness")
      .set("Cookie", [`${COOKIE_NAME}=${userA_Token}`]);

    expect(resUpdated.status).toBe(200);
    expect(resUpdated.body.completeness.percentage).toBeGreaterThan(resEmpty.body.completeness.percentage);
    expect(resUpdated.body.completeness.missingItems).not.toContain("At least one target role");
    expect(resUpdated.body.completeness.missingItems).not.toContain("Add at least 3 professional skills");
  });

  it("uses profile skills in job match calculation when no resume is uploaded", async () => {
    // Save profile with target role and skills
    const updateRes = await request(app)
      .patch("/api/profile")
      .set("Cookie", [`${COOKIE_NAME}=${userA_Token}`, csrfCookie])
      .set("x-csrf-token", csrfHeader)
      .send({
        targetRoles: ["Machine Learning Engineer"],
        skills: ["Python", "PyTorch", "TensorFlow", "FastAPI"],
      });
    expect(updateRes.status).toBe(200);

    // Create a real job in db
    const { jobs } = await import("../db/schema/jobs.js");
    const testJobId = "test-job-ml-1";
    await db.delete(jobs).where(eq(jobs.id, testJobId));
    await db.insert(jobs).values({
      id: testJobId,
      company: "Neural Corp",
      role: "Machine Learning Engineer",
      skills: ["Python", "PyTorch"],
      location: "San Francisco",
      url: "https://example.com/ml-job",
    });

    const matchRes = await request(app)
      .post(`/api/jobs/${testJobId}/match`)
      .set("Cookie", [`${COOKIE_NAME}=${userA_Token}`, csrfCookie])
      .set("x-csrf-token", csrfHeader);

    expect(matchRes.status).toBe(200);
    expect(matchRes.body.score).toBeGreaterThan(50);
    expect(matchRes.body.matchedSkills).toContain("python");
    expect(matchRes.body.matchedSkills).toContain("pytorch");

    // Clean up
    await db.delete(jobs).where(eq(jobs.id, testJobId));
  });
});
