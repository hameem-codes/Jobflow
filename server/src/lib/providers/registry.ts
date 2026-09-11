import { AdzunaProvider } from "./adzuna.js";
import { JobSpyProvider } from "./jobspy.js";
import { JobProvider, JobProviderResult, JobSearchInput } from "./types.js";
import { env } from "../../config/env.js";
import { logger } from "../logger.js";

export class ProviderRegistry {
  private primaryProvider: JobProvider;
  private fallbackProvider: JobProvider;

  constructor() {
    this.primaryProvider = new JobSpyProvider();
    this.fallbackProvider = new AdzunaProvider();
  }

  async search(input: JobSearchInput): Promise<JobProviderResult> {
    const rawJobSpyUrl = process.env.JOBSPY_SERVICE_URL?.trim() || (env.JOBSPY_SERVICE_URL !== "http://127.0.0.1:8000" ? env.JOBSPY_SERVICE_URL?.trim() : "");
    const hasJobSpyConfigured = Boolean(rawJobSpyUrl && rawJobSpyUrl !== "");

    if (!hasJobSpyConfigured) {
      logger.info({ input, provider: this.fallbackProvider.name }, "JobSpy service URL not configured, using Adzuna as primary provider");
      return this.fallbackProvider.searchJobs(input);
    }

    logger.info({ input, provider: this.primaryProvider.name }, "Attempting primary provider");
    
    let allJobs: any[] = [];
    let primaryError: any = null;

    const primaryResult = await this.primaryProvider.searchJobs(input);
    if (!primaryResult.error && primaryResult.jobs.length > 0) {
      allJobs = [...primaryResult.jobs];
    } else {
      primaryError = primaryResult.error || "Zero results from primary provider";
    }

    // If empty or error, try Adzuna
    if (allJobs.length === 0) {
      if (primaryError) {
        logger.warn({ error: primaryError }, "Primary provider failed or returned empty, attempting fallback");
      }
      
      logger.info({ input, provider: this.fallbackProvider.name }, "Attempting fallback provider");
      const fallbackResult = await this.fallbackProvider.searchJobs(input);
      
      if (!fallbackResult.error && fallbackResult.jobs.length > 0) {
        allJobs = [...allJobs, ...fallbackResult.jobs];
      } else if (fallbackResult.error) {
        logger.error({ error: fallbackResult.error }, "Fallback provider also failed");
      }
    }

    // Deduplicate by title + company (simple heuristic) or externalId
    const seen = new Set<string>();
    const deduplicatedJobs = allJobs.filter(job => {
      // Use a composite key or externalId
      const key = job.externalId || `${job.title}-${job.company}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (deduplicatedJobs.length === 0) {
      return { jobs: [], error: "All providers failed to return results" };
    }

    return { jobs: deduplicatedJobs, total: deduplicatedJobs.length, page: input.page || 1 };
  }
}

export const providerRegistry = new ProviderRegistry();

