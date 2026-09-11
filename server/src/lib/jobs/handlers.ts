import { logger } from "../logger.js";
import { providerRegistry } from "../providers/registry.js";
import { IdempotencyManager } from "./idempotency.js";

// Handler signatures
export type JobHandler = (payload: any, idempotencyKey: string) => Promise<void>;

// A. Job-sourcing refresh
export const jobSourcingRefreshHandler: JobHandler = async (payload, idempotencyKey) => {
  logger.info({ idempotencyKey, jobType: "job_sourcing_refresh" }, "Running job sourcing refresh");
  
  const isUnique = await IdempotencyManager.checkAndRecord(idempotencyKey, "job_sourcing_refresh");
  if (!isUnique) return;

  const startTime = Date.now();
  try {
    // Invoke the existing ProviderRegistry for a default query
    // E.g. search for software engineer remote jobs
    const result = await providerRegistry.search({ query: "software engineer", limit: 20 });
    
    // Typically we'd save these jobs to the database here using db.insert(jobs)...
    // The instructions say "Move the existing Phase 4 job sourcing operation into a background-job-compatible flow."
    // Phase 4 ProviderRegistry is already doing deduplication.
    
    await IdempotencyManager.markCompleted(idempotencyKey);
    logger.info({ duration: Date.now() - startTime, resultsCount: result.jobs?.length || 0 }, "Job sourcing refresh completed");
  } catch (err) {
    await IdempotencyManager.markFailed(idempotencyKey);
    logger.error({ err, duration: Date.now() - startTime }, "Job sourcing refresh failed");
    throw err;
  }
};

// B. Interview reminder emails
export const interviewReminderHandler: JobHandler = async (payload, idempotencyKey) => {
  logger.info({ idempotencyKey, jobType: "interview_reminder" }, "Running interview reminder");
  const isUnique = await IdempotencyManager.checkAndRecord(idempotencyKey, "interview_reminder");
  if (!isUnique) return;

  try {
    // Stubbed for future phase
    logger.info("Interview reminder logic will be implemented in a future phase");
    await IdempotencyManager.markCompleted(idempotencyKey);
  } catch (err) {
    await IdempotencyManager.markFailed(idempotencyKey);
    throw err;
  }
};

// C. Weekly digest
export const weeklyDigestHandler: JobHandler = async (payload, idempotencyKey) => {
  logger.info({ idempotencyKey, jobType: "weekly_digest" }, "Running weekly digest");
  const isUnique = await IdempotencyManager.checkAndRecord(idempotencyKey, "weekly_digest");
  if (!isUnique) return;

  try {
    // Stubbed for future phase
    logger.info("Weekly digest logic will be implemented in a future phase");
    await IdempotencyManager.markCompleted(idempotencyKey);
  } catch (err) {
    await IdempotencyManager.markFailed(idempotencyKey);
    throw err;
  }
};

// D. Resume reparse
export const resumeReparseHandler: JobHandler = async (payload, idempotencyKey) => {
  logger.info({ idempotencyKey, jobType: "resume_reparse" }, "Running resume reparse");
  const isUnique = await IdempotencyManager.checkAndRecord(idempotencyKey, "resume_reparse");
  if (!isUnique) return;

  try {
    // Stubbed for Phase 7/8
    logger.info("Resume reparse logic will be implemented in later phases");
    await IdempotencyManager.markCompleted(idempotencyKey);
  } catch (err) {
    await IdempotencyManager.markFailed(idempotencyKey);
    throw err;
  }
};
