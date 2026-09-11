import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { db } from "../db/index.js";
import { applications } from "../db/schema/applications.js";
import { contacts } from "../db/schema/contacts.js";
import { interviewRounds } from "../db/schema/interview_rounds.js";
import { applicationEvents } from "../db/schema/application_events.js";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { ApiError } from "../lib/ApiError.js";

export const applicationsRouter = Router();
applicationsRouter.use(requireAuth);

// Get all applications for the user
applicationsRouter.get("/", async (req, res, next) => {
  try {
    const userApps = await db
      .select()
      .from(applications)
      .where(eq(applications.userId, req.user!.jobflowId));

    // For full functional parity we need nested contacts, events, interviews
    const enriched = await Promise.all(
      userApps.map(async (app) => {
        const appContacts = await db.select().from(contacts).where(eq(contacts.applicationId, app.id));
        const appInterviews = await db.select().from(interviewRounds).where(eq(interviewRounds.applicationId, app.id));
        const appEvents = await db.select().from(applicationEvents).where(eq(applicationEvents.applicationId, app.id));
        
        return {
          ...app,
          contacts: appContacts,
          interviews: appInterviews.map(i => ({
             id: i.id,
             type: i.type,
             date: i.date?.toISOString()
          })),
          events: appEvents.map(e => ({
             id: e.id,
             date: e.date?.toISOString(),
             text: e.text
          }))
        };
      })
    );

    res.status(200).json({ applications: enriched });
  } catch (error) {
    next(error);
  }
});

// Add an application
applicationsRouter.post("/", validate({ 
  body: z.object({ jobId: z.string() }) 
}), async (req, res, next) => {
  try {
    const { jobId } = req.body;
    const appId = `app_${nanoid()}`;
    
    await db.insert(applications).values({
      id: appId,
      userId: req.user!.jobflowId,
      jobId,
      stage: "Saved",
      followUp: "",
      notes: ""
    });

    await db.insert(applicationEvents).values({
      id: `evt_${nanoid()}`,
      applicationId: appId,
      date: new Date(),
      text: "Added to pipeline",
    });

    res.status(201).json({ id: appId });
  } catch (error) {
    next(error);
  }
});

// Update an application
applicationsRouter.put("/:id", validate({
  body: z.object({
    stage: z.string().optional(),
    notes: z.string().optional(),
    followUp: z.string().optional()
  })
}), async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const [updatedApp] = await db.update(applications)
      .set(updateData)
      .where(and(eq(applications.id, id), eq(applications.userId, req.user!.jobflowId)))
      .returning();

    if (!updatedApp) {
      return next(ApiError.notFound("Application not found"));
    }

    if (updateData.stage) {
      await db.insert(applicationEvents).values({
        id: `evt_${nanoid()}`,
        applicationId: id,
        date: new Date(),
        text: `Moved to ${updateData.stage}`,
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Add contact
applicationsRouter.post("/:id/contacts", validate({
  body: z.object({
    name: z.string(),
    title: z.string().optional(),
    email: z.string().optional(),
    linkedin: z.string().optional(),
    status: z.string().optional()
  })
}), async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify parent application belongs to user
    const [userApp] = await db.select({ id: applications.id })
      .from(applications)
      .where(and(eq(applications.id, id), eq(applications.userId, req.user!.jobflowId)))
      .limit(1);

    if (!userApp) {
      return next(ApiError.notFound("Application not found"));
    }

    const contactData = req.body;
    const contactId = `contact_${nanoid()}`;
    
    await db.insert(contacts).values({
      id: contactId,
      userId: req.user!.jobflowId,
      applicationId: id,
      ...contactData
    });

    res.status(201).json({ id: contactId });
  } catch (error) {
    next(error);
  }
});

// Update contact
applicationsRouter.put("/:id/contacts/:contactId", async (req, res, next) => {
  try {
    const { contactId } = req.params;
    
    const [updated] = await db.update(contacts)
      .set({ ...req.body, updatedAt: new Date() })
      .where(and(eq(contacts.id, contactId), eq(contacts.userId, req.user!.jobflowId)))
      .returning();

    if (!updated) {
      return next(ApiError.notFound("Contact not found"));
    }

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Delete contact
applicationsRouter.delete("/:id/contacts/:contactId", async (req, res, next) => {
  try {
    const { contactId } = req.params;
    
    const [deleted] = await db.delete(contacts)
      .where(and(eq(contacts.id, contactId), eq(contacts.userId, req.user!.jobflowId)))
      .returning();

    if (!deleted) {
      return next(ApiError.notFound("Contact not found"));
    }

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Add interview
applicationsRouter.post("/:id/interviews", validate({
  body: z.object({
    type: z.string(),
    date: z.string()
  })
}), async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify parent application belongs to user
    const [userApp] = await db.select({ id: applications.id })
      .from(applications)
      .where(and(eq(applications.id, id), eq(applications.userId, req.user!.jobflowId)))
      .limit(1);

    if (!userApp) {
      return next(ApiError.notFound("Application not found"));
    }

    const interviewData = req.body;
    const interviewId = `int_${nanoid()}`;
    
    await db.insert(interviewRounds).values({
      id: interviewId,
      applicationId: id,
      type: interviewData.type,
      date: new Date(interviewData.date)
    });

    res.status(201).json({ id: interviewId });
  } catch (error) {
    next(error);
  }
});

// Delete interview
applicationsRouter.delete("/:id/interviews/:interviewId", async (req, res, next) => {
  try {
    const { id, interviewId } = req.params;

    // Verify parent application belongs to user
    const [userApp] = await db.select({ id: applications.id })
      .from(applications)
      .where(and(eq(applications.id, id), eq(applications.userId, req.user!.jobflowId)))
      .limit(1);

    if (!userApp) {
      return next(ApiError.notFound("Application not found"));
    }

    const [deleted] = await db.delete(interviewRounds)
      .where(and(eq(interviewRounds.id, interviewId), eq(interviewRounds.applicationId, id)))
      .returning();

    if (!deleted) {
      return next(ApiError.notFound("Interview round not found"));
    }

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
});
