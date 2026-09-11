import { db } from "./index.js";
import { jobs } from "./schema/jobs.js";
import { NormalizedJob } from "../lib/providers/types.js";
import { nanoid } from "nanoid";
import crypto from "crypto";
import { logger } from "../lib/logger.js";

// Helper to generate a fallback externalId based on content if the provider didn't supply one
export function generateFingerprint(job: NormalizedJob): string {
  if (job.externalId) return job.externalId;
  const raw = `${job.source}:${job.company}:${job.title}:${job.url || ""}`;
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export async function upsertJobs(normalizedJobs: NormalizedJob[]) {
  if (normalizedJobs.length === 0) return [];

  const valuesToInsert = normalizedJobs.map(job => {
    const extId = generateFingerprint(job);
    return {
      id: nanoid(),
      company: job.company,
      role: job.title,
      location: job.location || null,
      remote: job.remote || null,
      experience: job.experience || null,
      salary: job.salary ? Math.round(job.salary) : null,
      url: job.url || null,
      skills: job.skills || null,
      source: job.source,
      externalId: extId,
      createdAt: job.createdAt || new Date(),
    };
  });

  try {
    // We use ON CONFLICT DO NOTHING to avoid duplicate jobs
    // The unique constraint is on (source, external_id)
    const inserted = await db.insert(jobs)
      .values(valuesToInsert)
      .onConflictDoNothing({ target: [jobs.source, jobs.externalId] })
      .returning();

    logger.info({ insertedCount: inserted.length, totalAttempted: valuesToInsert.length }, "Jobs upserted");
    return inserted;
  } catch (error) {
    logger.error({ err: error }, "Failed to upsert jobs");
    throw error;
  }
}
