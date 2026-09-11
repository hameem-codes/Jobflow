import { Router, Request, Response, NextFunction } from "express";
import { requireAuth } from "../middleware/auth.js";
import { db } from "../db/index.js";
import { applicationEvents } from "../db/schema/application_events.js";
import { applications } from "../db/schema/applications.js";
import { jobs } from "../db/schema/jobs.js";
import { eq, desc } from "drizzle-orm";

export const notificationsRouter = Router();
notificationsRouter.use(requireAuth);

/**
 * GET /api/notifications
 * Retrieves application events for the authenticated user ordered most-recent-first.
 * Never returns static or mock data; returns an empty array if zero events exist.
 */
notificationsRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.jobflowId;

    const events = await db
      .select({
        id: applicationEvents.id,
        applicationId: applicationEvents.applicationId,
        text: applicationEvents.text,
        date: applicationEvents.date,
        createdAt: applicationEvents.createdAt,
        stage: applications.stage,
        jobId: applications.jobId,
        jobRole: jobs.role,
        jobCompany: jobs.company,
      })
      .from(applicationEvents)
      .innerJoin(applications, eq(applicationEvents.applicationId, applications.id))
      .leftJoin(jobs, eq(applications.jobId, jobs.id))
      .where(eq(applications.userId, userId))
      .orderBy(desc(applicationEvents.createdAt));

    const notifications = events.map((event) => ({
      id: event.id,
      applicationId: event.applicationId,
      type: "application_event",
      title: event.jobRole ? `${event.jobRole} at ${event.jobCompany || "Company"}` : "Application Update",
      text: event.text,
      stage: event.stage,
      date: event.date ? event.date.toISOString() : event.createdAt.toISOString(),
      createdAt: event.createdAt.toISOString(),
    }));

    return res.status(200).json(notifications);
  } catch (error) {
    next(error);
  }
});
