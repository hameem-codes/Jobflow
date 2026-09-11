import { JobProvider, JobProviderResult, JobSearchInput, NormalizedJob } from "./types.js";
import { env } from "../../config/env.js";
import { logger } from "../logger.js";
import axios from "axios";
// Rate limiting constants
const ADZUNA_LIMITS = {
  MINUTE: 25,
  DAY: 250,
  WEEK: 1000,
  MONTH: 2500,
};

const TIME_MS = {
  MINUTE: 60000,
  DAY: 86400000,
  WEEK: 604800000,
  MONTH: 2592000000, // Approx 30 days
};

// Rate limiting state
class AdzunaRateLimiter {
  private requests: Date[] = [];
  
  canMakeRequest(): boolean {
    const now = new Date();
    const nowMs = now.getTime();
    
    // Clean up old requests older than a month
    this.requests = this.requests.filter(d => nowMs - d.getTime() < TIME_MS.MONTH);
    
    let minCount = 0;
    let dayCount = 0;
    let weekCount = 0;
    const monthCount = this.requests.length;

    for (let i = this.requests.length - 1; i >= 0; i--) {
      const diff = nowMs - this.requests[i].getTime();
      if (diff < TIME_MS.MINUTE) minCount++;
      if (diff < TIME_MS.DAY) dayCount++;
      if (diff < TIME_MS.WEEK) weekCount++;
      else break; // Since it's chronologically ordered, we can optimize (wait, pushing to end means newest at end. Older is at start. So loop backwards until we hit the time bounds)
    }
    
    if (minCount >= ADZUNA_LIMITS.MINUTE) {
      logger.warn(`Adzuna rate limit exceeded: ${ADZUNA_LIMITS.MINUTE} requests per minute`);
      return false;
    }
    if (dayCount >= ADZUNA_LIMITS.DAY) {
      logger.warn(`Adzuna rate limit exceeded: ${ADZUNA_LIMITS.DAY} requests per day`);
      return false;
    }
    if (weekCount >= ADZUNA_LIMITS.WEEK) {
      logger.warn(`Adzuna rate limit exceeded: ${ADZUNA_LIMITS.WEEK} requests per week`);
      return false;
    }
    if (monthCount >= ADZUNA_LIMITS.MONTH) {
      logger.warn(`Adzuna rate limit exceeded: ${ADZUNA_LIMITS.MONTH} requests per month`);
      return false;
    }
    
    this.requests.push(now);
    return true;
  }
}

const rateLimiter = new AdzunaRateLimiter();

export class AdzunaProvider implements JobProvider {
  name = "adzuna";
  private baseUrl = "https://api.adzuna.com/v1/api/jobs";

  async searchJobs(input: JobSearchInput): Promise<JobProviderResult> {
    if (!env.ADZUNA_APP_ID || !env.ADZUNA_APP_KEY) {
      logger.warn("AdzunaProvider: Missing ADZUNA_APP_ID or ADZUNA_APP_KEY. Skipping adzuna.");
      return { jobs: [], error: "Adzuna credentials not configured" };
    }

    if (!rateLimiter.canMakeRequest()) {
      return { jobs: [], error: "Adzuna rate limit exceeded (Throttled)" };
    }

    try {
      const country = "us"; // Defaulting to US for now
      const page = input.page || 1;
      
      const response = await axios.get(`${this.baseUrl}/${country}/search/${page}`, {
        params: {
          app_id: env.ADZUNA_APP_ID,
          app_key: env.ADZUNA_APP_KEY,
          results_per_page: input.limit || 10,
          what: input.query,
          where: input.location,
          // Adzuna uses "content-type=application/json"
        },
        timeout: 10000, // 10 seconds timeout
      });

      const data = response.data;
      if (!data || !data.results || !Array.isArray(data.results)) {
        logger.error({ data }, "AdzunaProvider: Malformed response");
        return { jobs: [], error: "Malformed response from Adzuna" };
      }

      const jobs: NormalizedJob[] = data.results.map((job: any) => ({
        externalId: String(job.id),
        source: this.name,
        title: job.title || "Unknown Title",
        company: job.company?.display_name || "Unknown Company",
        location: job.location?.display_name || null,
        remote: null, // Adzuna doesn't consistently provide remote bool
        salary: job.salary_min || job.salary_max ? ((job.salary_min || 0) + (job.salary_max || 0)) / 2 : null,
        url: job.redirect_url || null,
        createdAt: job.created ? new Date(job.created) : new Date(),
        metadata: {
          attribution: "Powered by Adzuna",
          category: job.category?.label,
        }
      }));

      return {
        jobs,
        total: data.count,
        page,
      };

    } catch (error: any) {
      // Safe error logging
      logger.error(
        { 
          message: error.message, 
          status: error.response?.status, 
          statusText: error.response?.statusText 
        }, 
        "AdzunaProvider: Request failed"
      );
      return { jobs: [], error: "Provider request failed" };
    }
  }
}
