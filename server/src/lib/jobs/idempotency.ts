import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { idempotencyKeys } from "../../db/schema/idempotency.js";
import { logger } from "../logger.js";

export class IdempotencyManager {
  /**
   * Attempts to record an idempotency key.
   * If it successfully inserts, returns true (safe to execute).
   * If it encounters a conflict, returns false (already executed or in progress).
   */
  static async checkAndRecord(key: string, jobType: string): Promise<boolean> {
    try {
      await db.insert(idempotencyKeys).values({
        key,
        jobType,
        status: "pending",
      });
      return true;
    } catch (err: any) {
      // 23505 is PostgreSQL's unique_violation error code
      if (err.code === "23505") {
        logger.info({ key, jobType }, "Idempotency key already exists. Skipping execution.");
        return false;
      }
      logger.error({ key, jobType, err }, "Error checking idempotency key");
      // On generic error, fail safe and don't execute
      throw err;
    }
  }

  /**
   * Marks an idempotency key as completed.
   */
  static async markCompleted(key: string): Promise<void> {
    try {
      await db.update(idempotencyKeys)
        .set({ status: "completed", updatedAt: new Date() })
        .where(eq(idempotencyKeys.key, key));
    } catch (err) {
      logger.error({ key, err }, "Failed to mark idempotency key as completed");
    }
  }

  /**
   * Marks an idempotency key as failed.
   */
  static async markFailed(key: string): Promise<void> {
    try {
      await db.update(idempotencyKeys)
        .set({ status: "failed", updatedAt: new Date() })
        .where(eq(idempotencyKeys.key, key));
    } catch (err) {
      logger.error({ key, err }, "Failed to mark idempotency key as failed");
    }
  }
}
