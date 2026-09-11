import { Router } from "express";
import { z } from "zod";
import { db } from "../db/index.js";
import { users } from "../db/schema/users.js";
import { profiles } from "../db/schema/profiles.js";
import { resumes } from "../db/schema/resumes.js";
import { jobs } from "../db/schema/jobs.js";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { ApiError } from "../lib/ApiError.js";
import { logger } from "../lib/logger.js";
import { calculateJobMatch } from "../lib/matching.js";
import { providerRegistry } from "../lib/providers/registry.js";
import { upsertJobs } from "../db/jobs.js";

export const profileRouter = Router();

// Enforce authentication on all profile endpoints
profileRouter.use(requireAuth);

const optionalUrl = z
  .string()
  .trim()
  .refine(
    (val) => val === "" || /^https?:\/\/[^\s$.?#].[^\s]*$/i.test(val),
    { message: "Must be a valid URL starting with http:// or https://" }
  )
  .optional()
  .nullable();

const educationItemSchema = z.object({
  id: z.string().min(1),
  school: z.string().min(1, "School is required"),
  degree: z.string().min(1, "Degree is required"),
  field: z.string().min(1, "Field of study is required"),
  year: z.string().min(1, "Year is required"),
  gpa: z.string().optional(),
});

const experienceItemSchema = z.object({
  id: z.string().min(1),
  company: z.string().min(1, "Company is required"),
  role: z.string().min(1, "Role is required"),
  location: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  current: z.boolean().optional(),
  bullets: z.array(z.string()).optional().default([]),
});

const projectItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Project name is required"),
  description: z.string().min(1, "Description is required"),
  link: optionalUrl,
  bullets: z.array(z.string()).optional().default([]),
});

const certificationItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Certification name is required"),
  issuer: z.string().min(1, "Issuer is required"),
  issueDate: z.string().optional(),
  url: optionalUrl,
});

const courseItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Course name is required"),
  provider: z.string().min(1, "Provider is required"),
});

const languageItemSchema = z.object({
  language: z.string().min(1, "Language is required"),
  proficiency: z.string().min(1, "Proficiency is required"),
});

const otherLinkItemSchema = z.object({
  label: z.string().min(1, "Label is required"),
  url: z.string().url("Must be a valid URL"),
});

const patchProfileSchema = z.object({
  // Identity
  name: z.string().min(1, "Name cannot be empty").optional(),
  headline: z.string().max(255).optional().nullable(),
  about: z.string().optional().nullable(),
  location: z.string().max(255).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),

  // Career
  targetRoles: z.array(z.string().trim()).optional(),
  careerLevel: z.string().max(100).optional().nullable(),
  targetIndustries: z.array(z.string().trim()).optional(),
  employmentTypes: z.array(z.string().trim()).optional(),
  internshipPreference: z.boolean().optional(),
  availability: z.string().max(100).optional().nullable(),

  // Job Preferences
  preferredLocations: z.array(z.string().trim()).optional(),
  remotePreference: z.boolean().optional(),
  hybridPreference: z.boolean().optional(),
  onsitePreference: z.boolean().optional(),
  willingToRelocate: z.boolean().optional(),
  preferredCountries: z.array(z.string().trim()).optional(),
  salaryExpectation: z.number().int().nonnegative().optional().nullable(),
  workAuthorization: z.string().max(100).optional().nullable(),
  sponsorshipRequired: z.boolean().optional(),

  // Professional
  skills: z.array(z.string().trim()).optional(),
  languages: z.array(languageItemSchema).optional(),
  education: z.array(educationItemSchema).optional(),
  experience: z.array(experienceItemSchema).optional(),
  certifications: z.array(certificationItemSchema).optional(),
  courses: z.array(courseItemSchema).optional(),
  projects: z.array(projectItemSchema).optional(),
  awards: z.array(z.object({
    id: z.string(),
    title: z.string(),
    issuer: z.string().optional(),
    date: z.string().optional(),
  })).optional(),
  publications: z.array(z.object({
    id: z.string(),
    title: z.string(),
    publisher: z.string().optional(),
    url: optionalUrl,
    date: z.string().optional(),
  })).optional(),
  volunteerExperience: z.array(z.object({
    id: z.string(),
    organization: z.string(),
    role: z.string(),
    bullets: z.array(z.string()).optional(),
  })).optional(),

  // Portfolio
  githubUrl: optionalUrl,
  linkedinUrl: optionalUrl,
  portfolioUrl: optionalUrl,
  websiteUrl: optionalUrl,
  otherLinks: z.array(otherLinkItemSchema).optional(),

  // AI Preferences
  strongestSkills: z.array(z.string().trim()).optional(),
  skillsLearning: z.array(z.string().trim()).optional(),
  skillsWantingToDevelop: z.array(z.string().trim()).optional(),
  preferredRoles: z.array(z.string().trim()).optional(),
  rolesWillingToConsider: z.array(z.string().trim()).optional(),
  preferredIndustries: z.array(z.string().trim()).optional(),
  companiesInterestedIn: z.array(z.string().trim()).optional(),
  jobTypesToAvoid: z.array(z.string().trim()).optional(),
});

/**
 * Helper to ensure a profile record exists for the user and return it joined with basic user info
 */
async function getOrCreateProfile(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) {
    throw ApiError.notFound("User not found");
  }

  let [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);

  if (!profile) {
    // Provision initial profile record from user basics
    const [created] = await db.insert(profiles).values({
      userId,
      headline: user.title || null,
      location: user.locationPreference || null,
      targetRoles: user.targetRole ? [user.targetRole] : [],
      preferredLocations: user.locationPreference ? [user.locationPreference] : [],
    }).returning();
    profile = created;
  }

  return {
    ...profile,
    name: user.name,
    email: user.email,
  };
}

// GET /api/profile - Retrieve authenticated user's profile
profileRouter.get("/", async (req, res, next) => {
  try {
    const userId = req.user!.jobflowId;
    const profile = await getOrCreateProfile(userId);
    return res.status(200).json({ profile });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/profile - Update authenticated user's profile
profileRouter.patch("/", validate({ body: patchProfileSchema }), async (req, res, next) => {
  try {
    const userId = req.user!.jobflowId;
    const body = req.body as z.infer<typeof patchProfileSchema>;

    // Ensure profile row exists
    await getOrCreateProfile(userId);

    const { name, ...profileFields } = body;

    // Update profiles table
    const [updatedProfile] = await db
      .update(profiles)
      .set({
        ...profileFields,
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, userId))
      .returning();

    // Synchronize corresponding core fields on users table
    const userUpdates: Partial<typeof users.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (name !== undefined) userUpdates.name = name;
    if (profileFields.headline !== undefined && profileFields.headline !== null) {
      userUpdates.title = profileFields.headline;
    }
    if (profileFields.location !== undefined && profileFields.location !== null) {
      userUpdates.locationPreference = profileFields.location;
    }
    if (profileFields.targetRoles && profileFields.targetRoles.length > 0) {
      userUpdates.targetRole = profileFields.targetRoles[0];
    }

    const [updatedUser] = await db
      .update(users)
      .set(userUpdates)
      .where(eq(users.id, userId))
      .returning();

    logger.info({ userId }, "Updated user profile successfully");

    return res.status(200).json({
      profile: {
        ...updatedProfile,
        name: updatedUser?.name || name,
        email: updatedUser?.email,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/profile/preferences - Dedicated job preferences endpoint
profileRouter.get("/preferences", async (req, res, next) => {
  try {
    const userId = req.user!.jobflowId;
    const profile = await getOrCreateProfile(userId);

    return res.status(200).json({
      preferences: {
        preferredLocations: profile.preferredLocations || [],
        remotePreference: profile.remotePreference ?? false,
        hybridPreference: profile.hybridPreference ?? false,
        onsitePreference: profile.onsitePreference ?? false,
        willingToRelocate: profile.willingToRelocate ?? false,
        preferredCountries: profile.preferredCountries || [],
        salaryExpectation: profile.salaryExpectation,
        workAuthorization: profile.workAuthorization,
        sponsorshipRequired: profile.sponsorshipRequired ?? false,
        targetRoles: profile.targetRoles || [],
        careerLevel: profile.careerLevel,
        employmentTypes: profile.employmentTypes || [],
        internshipPreference: profile.internshipPreference ?? false,
        targetIndustries: profile.targetIndustries || [],
      },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/profile/preferences - Update job preferences
const patchPreferencesSchema = z.object({
  preferredLocations: z.array(z.string().trim()).optional(),
  remotePreference: z.boolean().optional(),
  hybridPreference: z.boolean().optional(),
  onsitePreference: z.boolean().optional(),
  willingToRelocate: z.boolean().optional(),
  preferredCountries: z.array(z.string().trim()).optional(),
  salaryExpectation: z.number().int().nonnegative().optional().nullable(),
  workAuthorization: z.string().max(100).optional().nullable(),
  sponsorshipRequired: z.boolean().optional(),
  targetRoles: z.array(z.string().trim()).optional(),
  careerLevel: z.string().max(100).optional().nullable(),
  employmentTypes: z.array(z.string().trim()).optional(),
  internshipPreference: z.boolean().optional(),
  targetIndustries: z.array(z.string().trim()).optional(),
});

profileRouter.patch("/preferences", validate({ body: patchPreferencesSchema }), async (req, res, next) => {
  try {
    const userId = req.user!.jobflowId;
    await getOrCreateProfile(userId);

    const [updated] = await db
      .update(profiles)
      .set({
        ...req.body,
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, userId))
      .returning();

    if (req.body.targetRoles && req.body.targetRoles.length > 0) {
      await db
        .update(users)
        .set({ targetRole: req.body.targetRoles[0], updatedAt: new Date() })
        .where(eq(users.id, userId));
    }

    return res.status(200).json({ preferences: updated });
  } catch (error) {
    next(error);
  }
});

// GET /api/profile/completeness - Deterministic completeness calculation
profileRouter.get("/completeness", async (req, res, next) => {
  try {
    const userId = req.user!.jobflowId;
    const profile = await getOrCreateProfile(userId);

    const [latestResume] = await db
      .select({ id: resumes.id })
      .from(resumes)
      .where(eq(resumes.userId, userId))
      .limit(1);

    const missingItems: string[] = [];
    const completedCategories: string[] = [];

    // 1. Identity (weight: 15)
    let identityScore = 0;
    if (profile.name?.trim()) identityScore += 5;
    else missingItems.push("Full name");
    if (profile.headline?.trim()) identityScore += 5;
    else missingItems.push("Professional headline");
    if (profile.location?.trim()) identityScore += 5;
    else missingItems.push("Current location");
    if (identityScore >= 15) completedCategories.push("Identity");

    // 2. Career Target (weight: 15)
    let careerScore = 0;
    if (profile.targetRoles && profile.targetRoles.length > 0) careerScore += 8;
    else missingItems.push("At least one target role");
    if (profile.careerLevel?.trim()) careerScore += 4;
    else missingItems.push("Career level");
    if (profile.employmentTypes && profile.employmentTypes.length > 0) careerScore += 3;
    else missingItems.push("Employment types");
    if (careerScore >= 15) completedCategories.push("Career Goals");

    // 3. Preferences (weight: 10)
    let prefScore = 0;
    if (profile.preferredLocations && profile.preferredLocations.length > 0) prefScore += 5;
    else missingItems.push("Preferred job location");
    if (profile.remotePreference || profile.hybridPreference || profile.onsitePreference) prefScore += 5;
    else missingItems.push("Work mode preference (Remote/Hybrid/Onsite)");
    if (prefScore >= 10) completedCategories.push("Preferences");

    // 4. Skills (weight: 15)
    let skillsScore = 0;
    const skillCount = profile.skills?.length || 0;
    if (skillCount >= 3) skillsScore = 15;
    else if (skillCount > 0) {
      skillsScore = Math.round((skillCount / 3) * 15);
      missingItems.push(`Add ${3 - skillCount} more skill(s) (minimum 3)`);
    } else {
      missingItems.push("Add at least 3 professional skills");
    }
    if (skillsScore >= 15) completedCategories.push("Skills");

    // 5. Experience (weight: 15)
    let expScore = 0;
    if (profile.experience && profile.experience.length > 0) expScore = 15;
    else missingItems.push("At least one work experience entry");
    if (expScore >= 15) completedCategories.push("Experience");

    // 6. Education (weight: 10)
    let eduScore = 0;
    if (profile.education && profile.education.length > 0) eduScore = 10;
    else missingItems.push("At least one education entry");
    if (eduScore >= 10) completedCategories.push("Education");

    // 7. Portfolio/Projects (weight: 10)
    let projScore = 0;
    const hasProject = profile.projects && profile.projects.length > 0;
    const hasLink = Boolean(profile.githubUrl || profile.linkedinUrl || profile.portfolioUrl || profile.websiteUrl);
    if (hasProject) projScore += 5;
    else missingItems.push("At least one project");
    if (hasLink) projScore += 5;
    else missingItems.push("At least one portfolio link (GitHub, LinkedIn, Website)");
    if (projScore >= 10) completedCategories.push("Projects & Portfolio");

    // 8. Resume (weight: 10)
    let resumeScore = 0;
    if (latestResume) resumeScore = 10;
    else missingItems.push("Upload a resume");
    if (resumeScore >= 10) completedCategories.push("Resume");

    const totalPercentage = Math.min(100, Math.max(0, identityScore + careerScore + prefScore + skillsScore + expScore + eduScore + projScore + resumeScore));

    return res.status(200).json({
      completeness: {
        percentage: totalPercentage,
        completedCategories,
        missingItems,
        breakdown: {
          identity: identityScore,
          career: careerScore,
          preferences: prefScore,
          skills: skillsScore,
          experience: expScore,
          education: eduScore,
          portfolio: projScore,
          resume: resumeScore,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/profile/recommendations - Real job recommendations using profile & matching engine
profileRouter.get("/recommendations", async (req, res, next) => {
  try {
    const userId = req.user!.jobflowId;
    const profile = await getOrCreateProfile(userId);

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
      ...(profile.skills || []),
      ...resumeSkills,
    ]));

    // Query real jobs from database or provider using user's target role
    const primaryRole = profile.targetRoles?.[0] || profile.headline || "Software Engineer";
    const primaryLocation = profile.preferredLocations?.[0] || profile.location || undefined;

    // Search real provider
    const searchResult = await providerRegistry.search({
      query: primaryRole,
      location: primaryLocation,
      remote: profile.remotePreference ?? undefined,
      page: 1,
      limit: 15,
    });

    if (searchResult.jobs.length > 0) {
      await upsertJobs(searchResult.jobs);
    }

    // Fetch up to 20 jobs from db matching role
    const candidateJobs = searchResult.jobs.length > 0
      ? searchResult.jobs
      : await db.select().from(jobs).limit(20);

    if (candidateJobs.length === 0) {
      return res.status(200).json({
        recommendations: [],
        message: "No matching jobs were found right now.",
      });
    }

    // Rank candidate jobs with authoritative matching engine
    const scoredJobs = candidateJobs.map(job => {
      const jobRecord = job as any;
      const match = calculateJobMatch({
        resumeText: latestResume?.text || null,
        resumeSkills: combinedSkills,
        targetRole: primaryRole,
        userTitle: profile.headline,
        jobRole: jobRecord.role || jobRecord.title || "",
        jobSkills: jobRecord.skills || [],
        jobCompany: jobRecord.company || "",
      });

      return {
        job,
        score: match.score,
        matchedSkills: match.matchedSkills,
        missingSkills: match.missingSkills,
        breakdown: match.breakdown,
        reason: match.score >= 70
          ? `Strong match for your target role "${primaryRole}" with ${match.matchedSkills.length} matching skills.`
          : `Aligns with your profile role "${primaryRole}". Add ${match.missingSkills.slice(0, 3).join(", ")} to boost readiness.`,
      };
    });

    // Sort by match score descending
    scoredJobs.sort((a, b) => b.score - a.score);

    return res.status(200).json({
      recommendations: scoredJobs.slice(0, 10),
      basedOn: {
        role: primaryRole,
        location: primaryLocation || "Any",
        skillsCount: combinedSkills.length,
      },
    });
  } catch (error) {
    next(error);
  }
});
