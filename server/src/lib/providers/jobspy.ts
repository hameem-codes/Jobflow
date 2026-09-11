import { JobProvider, JobProviderResult, JobSearchInput, NormalizedJob } from "./types.js";
import { env } from "../../config/env.js";
import { logger } from "../logger.js";
import axios from "axios";

export class JobSpyProvider implements JobProvider {
  name = "jobspy";

  async searchJobs(input: JobSearchInput): Promise<JobProviderResult> {
    try {
      const response = await axios.post(`${env.JOBSPY_SERVICE_URL}/api/jobs/scrape`, {
        query: input.query,
        location: input.location,
        remote: input.remote,
        page: input.page || 1,
        limit: input.limit || 10,
      }, {
        timeout: 30000, // JobSpy scrapes can be slow
      });

      const data = response.data;
      if (!data || !Array.isArray(data.jobs)) {
        logger.error({ data }, "JobSpyProvider: Malformed response");
        return { jobs: [], error: "Malformed response from JobSpy service" };
      }

      const jobs: NormalizedJob[] = data.jobs.map((job: any) => ({
        externalId: job.externalId || null,
        source: this.name,
        title: job.title || "Unknown Title",
        company: job.company || "Unknown Company",
        location: job.location || null,
        remote: job.remote === "True" || job.remote === "true" || job.remote === true ? "Yes" : null,
        salary: job.salary ? Number(job.salary) : null,
        url: job.url || null,
        createdAt: job.createdAt ? new Date(job.createdAt) : new Date(),
        metadata: job.metadata || {},
      }));

      return {
        jobs,
        total: data.total,
        page: data.page,
      };

    } catch (error: any) {
      logger.error(
        { 
          message: error.message, 
          status: error.response?.status 
        }, 
        "JobSpyProvider: Request failed"
      );
      return { jobs: [], error: "JobSpy service request failed" };
    }
  }
}
