import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { providerRegistry } from "../lib/providers/registry.js";
import { upsertJobs } from "../db/jobs.js";
import { requireAuth } from "../middleware/auth.js";
import { logger } from "../lib/logger.js";
import { ApiError } from "../lib/ApiError.js";

export const jobsRouter = Router();

// We apply requireAuth because Phase 2 established authentication boundaries.
// Depending on exact product needs, job search might be public or mixed, but we enforce it here as safe default.
jobsRouter.use(requireAuth);

jobsRouter.get("/", async (req, res, next) => {
  try {
    const { db } = await import("../db/index.js");
    const { jobs: jobsTable } = await import("../db/schema/jobs.js");
    const dbJobs = await db.select().from(jobsTable).limit(50);
    return res.status(200).json({ jobs: dbJobs });
  } catch (error) {
    next(error);
  }
});

const searchSchema = z.object({
  query: z.string().optional(),
  location: z.string().optional(),
  remote: z.enum(["true", "false"]).optional().transform(v => v === "true"),
  page: z.coerce.number().min(1).max(50).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
});

jobsRouter.get("/search", validate({ query: searchSchema }), async (req, res, next) => {
  try {
    const searchInput = req.query as unknown as z.infer<typeof searchSchema>;
    const userId = req.user?.jobflowId;

    let finalQuery = searchInput.query?.trim();
    let finalLocation = searchInput.location?.trim();
    let finalRemote: boolean | undefined = searchInput.remote;

    // If query/location/remote omitted, use persisted user profile preferences
    if (userId && (!finalQuery || !finalLocation || finalRemote === undefined)) {
      const { db } = await import("../db/index.js");
      const { profiles } = await import("../db/schema/profiles.js");
      const { users } = await import("../db/schema/users.js");
      const { eq } = await import("drizzle-orm");

      const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

      if (!finalQuery) {
        finalQuery = profile?.targetRoles?.[0] || user?.targetRole || "Software Engineer";
      }
      if (!finalLocation) {
        finalLocation = profile?.preferredLocations?.[0] || profile?.location || user?.locationPreference || undefined;
      }
      if (finalRemote === undefined && profile?.remotePreference != null) {
        finalRemote = profile.remotePreference;
      }
    }

    const resolvedSearch = {
      query: finalQuery || "Software Engineer",
      location: finalLocation,
      remote: finalRemote,
      page: searchInput.page,
      limit: searchInput.limit,
    };

    logger.info({ resolvedSearch, userId }, "Handling job search request with resolved preferences");

    // 1. Fetch from providers (Adzuna -> JobSpy fallback)
    const result = await providerRegistry.search(resolvedSearch);

    if (result.error && result.jobs.length === 0) {
      // If we got nothing back and an error was thrown, return 503 Service Unavailable
      return next(new ApiError(503, "PROVIDER_FAILED", result.error));
    }

    // 2. Deduplicate and save to database
    // Even if we just found them, we upsert them into our canonical jobs table
    await upsertJobs(result.jobs);

    // 3. Return the results
    return res.status(200).json({
      jobs: result.jobs,
      total: result.total,
      page: result.page,
      source_fallback: result.error ? true : false,
    });
  } catch (error) {
    next(error);
  }
});

const createJobSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  location: z.string().optional(),
  remote: z.string().optional(),
  experience: z.string().optional(),
  salary: z.number().optional(),
  url: z.string().optional(),
  skills: z.array(z.string()).optional(),
});

jobsRouter.post("/", validate({ body: createJobSchema }), async (req, res, next) => {
  try {
    const jobData = req.body;
    const { nanoid } = await import("nanoid");
    const { db } = await import("../db/index.js");
    const { jobs } = await import("../db/schema/jobs.js");
    
    const jobId = `job_${nanoid()}`;
    await db.insert(jobs).values({
      id: jobId,
      company: jobData.company,
      role: jobData.role,
      location: jobData.location,
      remote: jobData.remote,
      experience: jobData.experience,
      salary: jobData.salary,
      url: jobData.url,
      skills: jobData.skills || [],
      custom: true,
      saved: true,
      source: "custom",
      externalId: jobId,
    });
    
    return res.status(201).json({ 
      id: jobId, 
      ...jobData, 
      place: jobData.location || "Unknown",
      saved: true, 
      custom: true 
    });
  } catch (error) {
    next(error);
  }
});

const patchJobSchema = z.object({
  saved: z.boolean().optional(),
});

jobsRouter.patch("/:id", validate({ body: patchJobSchema }), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { saved } = req.body;
    const { db } = await import("../db/index.js");
    const { jobs } = await import("../db/schema/jobs.js");
    const { eq } = await import("drizzle-orm");

    const [updated] = await db
      .update(jobs)
      .set({ saved, updatedAt: new Date() })
      .where(eq(jobs.id, id))
      .returning();

    if (!updated) {
      return next(ApiError.notFound("Job not found"));
    }

    return res.status(200).json({ job: updated });
  } catch (error) {
    next(error);
  }
});

// Calculate explainable match score for a job against authenticated user's resume/profile
jobsRouter.post("/:id/match", async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.jobflowId;

    const { db } = await import("../db/index.js");
    const { jobs } = await import("../db/schema/jobs.js");
    const { resumes } = await import("../db/schema/resumes.js");
    const { users } = await import("../db/schema/users.js");
    const { eq, desc } = await import("drizzle-orm");
    const { calculateJobMatch } = await import("../lib/matching.js");

    // 1. Fetch job
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
    if (!job) {
      return next(ApiError.notFound("Job not found"));
    }

    // 2. Fetch user profile and preferences
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const { profiles } = await import("../db/schema/profiles.js");
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);

    // 3. Fetch user's most recent resume
    const [latestResume] = await db
      .select()
      .from(resumes)
      .where(eq(resumes.userId, userId))
      .orderBy(desc(resumes.createdAt))
      .limit(1);

    let resumeSkills: string[] = [];
    if (latestResume?.content && typeof latestResume.content === "object") {
      const contentObj = latestResume.content as Record<string, any>;
      if (Array.isArray(contentObj.skills)) {
        resumeSkills = contentObj.skills.filter(s => typeof s === "string");
      }
    }

    // Combine profile skills with resume skills
    const combinedSkills = Array.from(new Set([
      ...(profile?.skills || []),
      ...resumeSkills,
    ]));

    const targetRole = profile?.targetRoles?.[0] || user?.targetRole || user?.title || null;
    const userTitle = profile?.headline || user?.title || null;

    if (combinedSkills.length === 0 && (!latestResume?.text || latestResume.text.trim().length === 0)) {
      return res.status(200).json({
        insufficientData: true,
        message: "No resume or profile skills on file for this user. Please add skills to your profile or upload a resume to compute job match.",
      });
    }

    // 4. Compute match score
    const matchResult = calculateJobMatch({
      resumeText: latestResume?.text || null,
      resumeSkills: combinedSkills,
      targetRole,
      userTitle,
      jobRole: job.role,
      jobSkills: job.skills,
      jobCompany: job.company,
    });

    if (matchResult.insufficientData) {
      return res.status(200).json({
        insufficientData: true,
        message: "No resume or profile skills on file for this user. Please add skills to your profile or upload a resume to compute job match.",
      });
    }

    return res.status(200).json({
      jobId: id,
      score: matchResult.score,
      matchedSkills: matchResult.matchedSkills,
      missingSkills: matchResult.missingSkills,
      breakdown: matchResult.breakdown,
    });
  } catch (error) {
    next(error);
  }
});


