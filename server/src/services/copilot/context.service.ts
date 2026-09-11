import { db } from "../../db/index.js";
import { users } from "../../db/schema/users.js";
import { resumes } from "../../db/schema/resumes.js";
import { jobs } from "../../db/schema/jobs.js";
import { applications } from "../../db/schema/applications.js";
import { applicationEvents } from "../../db/schema/application_events.js";
import { contacts } from "../../db/schema/contacts.js";
import { interviewRounds } from "../../db/schema/interview_rounds.js";
import { eq, desc, and } from "drizzle-orm";
import { calculateJobMatch } from "../../lib/matching.js";
import { providerRegistry } from "../../lib/providers/registry.js";
import { logger } from "../../lib/logger.js";

import { profiles } from "../../db/schema/profiles.js";

export interface ProfileContext {
  name: string | null;
  title: string | null;
  headline: string | null;
  about: string | null;
  location: string | null;
  country: string | null;
  targetRole: string | null;
  targetRoles: string[];
  careerLevel: string | null;
  employmentTypes: string[];
  internshipPreference: boolean;
  preferredLocations: string[];
  remotePreference: boolean;
  hybridPreference: boolean;
  onsitePreference: boolean;
  willingToRelocate: boolean;
  salaryExpectation: number | null;
  workAuthorization: string | null;
  sponsorshipRequired: boolean;
  skills: string[];
  strongestSkills: string[];
  skillsLearning: string[];
  education: Array<{ school: string; degree: string; field: string; year: string }>;
  experience: Array<{ company: string; role: string; startDate?: string; endDate?: string }>;
  projects: Array<{ name: string; description: string; link?: string }>;
  portfolioLinks: {
    github?: string | null;
    linkedin?: string | null;
    portfolio?: string | null;
    website?: string | null;
  };
  hasTargetRole: boolean;
  missingFields: string[];
}

export interface ResumeContext {
  resumeAvailable: boolean;
  name?: string;
  text?: string | null;
  skills?: string[];
  atsScore?: number | null;
  contentScore?: number | null;
}

export interface ApplicationItemContext {
  id: string;
  jobTitle: string;
  company: string;
  stage: string;
  followUp: string | null;
  notes: string | null;
  events: Array<{ date?: string; text: string }>;
  contacts: Array<{ name: string; title?: string | null; email?: string | null }>;
  interviews: Array<{ type: string; date?: string }>;
}

export interface ApplicationsContext {
  count: number;
  applications: ApplicationItemContext[];
}

export interface JobContext {
  id: string;
  role: string;
  company: string;
  location?: string | null;
  remote?: string | null;
  salary?: number | null;
  skills?: string[] | null;
  experience?: string | null;
}

export interface MatchContext {
  jobId: string;
  jobRole: string;
  jobCompany: string;
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  insufficientData?: boolean;
  message?: string;
  breakdown?: {
    skillMatchPercentage: number;
    roleAlignmentScore: number;
    matchedCount: number;
    totalRequiredCount: number;
    roleAlignment: string;
  };
}

export class CopilotContextService {
  /**
   * Retrieves authenticated user's profile context.
   */
  async getProfileContext(jobflowId: string): Promise<ProfileContext> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, jobflowId))
        .limit(1);

      const [profile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.userId, jobflowId))
        .limit(1);

      const targetRoles = profile?.targetRoles && profile.targetRoles.length > 0
        ? profile.targetRoles
        : (user?.targetRole ? [user.targetRole] : []);

      const primaryTargetRole = targetRoles[0] || user?.targetRole || null;
      const location = profile?.location || user?.locationPreference || null;
      const title = profile?.headline || user?.title || null;

      const missingFields: string[] = [];
      if (!user?.name?.trim()) missingFields.push("Full name");
      if (!title?.trim()) missingFields.push("Professional headline / title");
      if (targetRoles.length === 0) missingFields.push("Target role(s)");
      if (!location?.trim() && (!profile?.preferredLocations || profile.preferredLocations.length === 0)) {
        missingFields.push("Location / preferred locations");
      }
      if (!profile?.skills || profile.skills.length < 3) {
        missingFields.push("At least 3 skills");
      }
      if (!profile?.experience || profile.experience.length === 0) {
        missingFields.push("Work experience");
      }
      if (!profile?.education || profile.education.length === 0) {
        missingFields.push("Education");
      }
      if (!profile?.githubUrl && !profile?.linkedinUrl && !profile?.portfolioUrl && !profile?.websiteUrl) {
        missingFields.push("Portfolio / LinkedIn link");
      }

      return {
        name: user?.name || null,
        title,
        headline: profile?.headline || title,
        about: profile?.about || null,
        location,
        country: profile?.country || null,
        targetRole: primaryTargetRole,
        targetRoles,
        careerLevel: profile?.careerLevel || null,
        employmentTypes: profile?.employmentTypes || [],
        internshipPreference: profile?.internshipPreference ?? false,
        preferredLocations: profile?.preferredLocations || (location ? [location] : []),
        remotePreference: profile?.remotePreference ?? false,
        hybridPreference: profile?.hybridPreference ?? false,
        onsitePreference: profile?.onsitePreference ?? false,
        willingToRelocate: profile?.willingToRelocate ?? false,
        salaryExpectation: profile?.salaryExpectation || null,
        workAuthorization: profile?.workAuthorization || null,
        sponsorshipRequired: profile?.sponsorshipRequired ?? false,
        skills: profile?.skills || [],
        strongestSkills: profile?.strongestSkills || [],
        skillsLearning: profile?.skillsLearning || [],
        education: (profile?.education || []).map(e => ({
          school: e.school,
          degree: e.degree,
          field: e.field,
          year: e.year,
        })),
        experience: (profile?.experience || []).map(e => ({
          company: e.company,
          role: e.role,
          startDate: e.startDate || undefined,
          endDate: e.endDate || undefined,
        })),
        projects: (profile?.projects || []).map(p => ({
          name: p.name,
          description: p.description,
          link: p.link || undefined,
        })),
        portfolioLinks: {
          github: profile?.githubUrl || null,
          linkedin: profile?.linkedinUrl || null,
          portfolio: profile?.portfolioUrl || null,
          website: profile?.websiteUrl || null,
        },
        hasTargetRole: Boolean(primaryTargetRole && primaryTargetRole.trim().length > 0),
        missingFields,
      };
    } catch (err) {
      logger.error({ err, jobflowId }, "Failed to fetch profile context");
      return {
        name: null,
        title: null,
        headline: null,
        about: null,
        location: null,
        country: null,
        targetRole: null,
        targetRoles: [],
        careerLevel: null,
        employmentTypes: [],
        internshipPreference: false,
        preferredLocations: [],
        remotePreference: false,
        hybridPreference: false,
        onsitePreference: false,
        willingToRelocate: false,
        salaryExpectation: null,
        workAuthorization: null,
        sponsorshipRequired: false,
        skills: [],
        strongestSkills: [],
        skillsLearning: [],
        education: [],
        experience: [],
        projects: [],
        portfolioLinks: {},
        hasTargetRole: false,
        missingFields: [],
      };
    }
  }

  /**
   * Retrieves user's latest resume context.
   */
  async getResumeContext(jobflowId: string): Promise<ResumeContext> {
    try {
      const [latest] = await db
        .select()
        .from(resumes)
        .where(eq(resumes.userId, jobflowId))
        .orderBy(desc(resumes.createdAt))
        .limit(1);

      if (!latest) {
        return { resumeAvailable: false };
      }

      let skills: string[] = [];
      if (latest.content && typeof latest.content === "object") {
        const contentObj = latest.content as Record<string, any>;
        if (Array.isArray(contentObj.skills)) {
          skills = contentObj.skills.filter(s => typeof s === "string");
        }
      }

      return {
        resumeAvailable: true,
        name: latest.name,
        text: latest.text || null,
        skills,
        atsScore: latest.ats,
        contentScore: latest.score,
      };
    } catch (err) {
      logger.error({ err, jobflowId }, "Failed to fetch resume context");
      return { resumeAvailable: false };
    }
  }

  /**
   * Retrieves tracked applications for the user.
   */
  async getApplicationsContext(jobflowId: string, specificAppId?: string): Promise<ApplicationsContext> {
    try {
      const query = db
        .select()
        .from(applications)
        .where(
          specificAppId
            ? and(eq(applications.userId, jobflowId), eq(applications.id, specificAppId))
            : eq(applications.userId, jobflowId)
        );

      const userApps = await query;
      if (userApps.length === 0) {
        return { count: 0, applications: [] };
      }

      const enriched = await Promise.all(
        userApps.map(async app => {
          const [job] = await db
            .select()
            .from(jobs)
            .where(eq(jobs.id, app.jobId))
            .limit(1);

          const appEvents = await db
            .select()
            .from(applicationEvents)
            .where(eq(applicationEvents.applicationId, app.id))
            .orderBy(desc(applicationEvents.date))
            .limit(5);

          const appContacts = await db
            .select()
            .from(contacts)
            .where(eq(contacts.applicationId, app.id))
            .limit(5);

          const appInterviews = await db
            .select()
            .from(interviewRounds)
            .where(eq(interviewRounds.applicationId, app.id))
            .orderBy(desc(interviewRounds.date))
            .limit(5);

          return {
            id: app.id,
            jobTitle: job?.role || "Unknown Role",
            company: job?.company || "Unknown Company",
            stage: app.stage,
            followUp: app.followUp || null,
            notes: app.notes || null,
            events: appEvents.map(e => ({ date: e.date?.toISOString(), text: e.text })),
            contacts: appContacts.map(c => ({ name: c.name, title: c.title, email: c.email })),
            interviews: appInterviews.map(i => ({ type: i.type, date: i.date?.toISOString() })),
          };
        })
      );

      return {
        count: enriched.length,
        applications: enriched,
      };
    } catch (err) {
      logger.error({ err, jobflowId }, "Failed to fetch applications context");
      return { count: 0, applications: [] };
    }
  }

  /**
   * Retrieves specific job context.
   */
  async getJobContext(jobId: string): Promise<JobContext | null> {
    try {
      const [job] = await db
        .select()
        .from(jobs)
        .where(eq(jobs.id, jobId))
        .limit(1);

      if (!job) return null;

      return {
        id: job.id,
        role: job.role,
        company: job.company,
        location: job.location,
        remote: job.remote,
        salary: job.salary,
        skills: job.skills,
        experience: job.experience,
      };
    } catch (err) {
      logger.error({ err, jobId }, "Failed to fetch job context");
      return null;
    }
  }

  /**
   * Evaluates deterministic match score using existing match engine.
   */
  async getJobMatchContext(jobflowId: string, jobId?: string): Promise<MatchContext | null> {
    try {
      // If no specific jobId, find user's latest viewed/applied job or first available job
      let targetJobId = jobId;
      if (!targetJobId) {
        const [recentApp] = await db
          .select({ jobId: applications.jobId })
          .from(applications)
          .where(eq(applications.userId, jobflowId))
          .limit(1);
        targetJobId = recentApp?.jobId;
      }

      if (!targetJobId) {
        const [firstJob] = await db.select({ id: jobs.id }).from(jobs).limit(1);
        targetJobId = firstJob?.id;
      }

      if (!targetJobId) {
        return null;
      }

      const [job] = await db.select().from(jobs).where(eq(jobs.id, targetJobId)).limit(1);
      if (!job) return null;

      const [user] = await db.select().from(users).where(eq(users.id, jobflowId)).limit(1);
      const [profile] = await db.select().from(profiles).where(eq(profiles.userId, jobflowId)).limit(1);
      const [latestResume] = await db
        .select()
        .from(resumes)
        .where(eq(resumes.userId, jobflowId))
        .orderBy(desc(resumes.createdAt))
        .limit(1);

      let resumeSkills: string[] = [];
      if (latestResume?.content && typeof latestResume.content === "object") {
        const contentObj = latestResume.content as Record<string, any>;
        if (Array.isArray(contentObj.skills)) {
          resumeSkills = contentObj.skills.filter(s => typeof s === "string");
        }
      }

      const combinedSkills = Array.from(new Set([
        ...(profile?.skills || []),
        ...resumeSkills,
      ]));

      const targetRole = profile?.targetRoles?.[0] || user?.targetRole || user?.title || null;
      const userTitle = profile?.headline || user?.title || null;

      if (combinedSkills.length === 0 && (!latestResume?.text || latestResume.text.trim().length === 0)) {
        return {
          jobId: targetJobId,
          jobRole: job.role,
          jobCompany: job.company,
          score: 0,
          matchedSkills: [],
          missingSkills: job.skills || [],
          insufficientData: true,
          message: "No resume or profile skills on file to compute job match. Add skills to your profile or upload a resume to see skill and role alignment.",
        };
      }

      const match = calculateJobMatch({
        resumeText: latestResume?.text || null,
        resumeSkills: combinedSkills,
        targetRole,
        userTitle,
        jobRole: job.role,
        jobSkills: job.skills,
        jobCompany: job.company,
      });

      return {
        jobId: targetJobId,
        jobRole: job.role,
        jobCompany: job.company,
        score: match.score,
        matchedSkills: match.matchedSkills,
        missingSkills: match.missingSkills,
        insufficientData: match.insufficientData,
        breakdown: match.breakdown,
      };
    } catch (err) {
      logger.error({ err, jobflowId, jobId }, "Failed to compute job match context");
      return null;
    }
  }

  /**
   * Searches real jobs using JobSpy/Adzuna pipeline.
   */
  async searchJobsContext(query: string, location?: string): Promise<{ jobs: any[]; total: number }> {
    try {
      const result = await providerRegistry.search({
        query: query.trim() || "internship",
        location: location || "",
        page: 1,
        limit: 5,
      });

      return {
        jobs: result.jobs || [],
        total: result.total || 0,
      };
    } catch (err) {
      logger.error({ err, query }, "Failed to search jobs for copilot");
      return { jobs: [], total: 0 };
    }
  }
}

export const copilotContextService = new CopilotContextService();
