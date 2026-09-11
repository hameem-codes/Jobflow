import { Router } from "express";
import { db } from "../db/index.js";
import { sql } from "drizzle-orm";
import { logger } from "../lib/logger.js";
import { env } from "../config/env.js";

export const readyRouter = Router();

readyRouter.get("/", async (req, res) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

  if (!env.DATABASE_URL) {
    logger.warn("Readiness check failed: DATABASE_URL is not configured.");
    return res.status(503).json({ status: "unavailable" });
  }

  try {
    // Perform a lightweight query with a timeout to verify DB connectivity
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Database readiness check timed out")), 2000)
    );
    
    await Promise.race([
      db.execute(sql`SELECT 1`),
      timeoutPromise
    ]);
    
    return res.status(200).json({ status: "ready" });
  } catch (error) {
    logger.error({ err: error }, "Readiness check failed: Database unreachable or timed out");
    return res.status(503).json({ status: "unavailable" });
  }
});
