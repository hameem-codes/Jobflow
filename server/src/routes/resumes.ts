import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import multer from "multer";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { db } from "../db/index.js";
import { resumes } from "../db/schema/resumes.js";
import { users } from "../db/schema/users.js";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { ApiError } from "../lib/ApiError.js";
import { ResumeParser } from "../lib/resumeParser.js";
import { StorageService } from "../services/storage.service.ts";
import { logger } from "../lib/logger.js";
import { copilotRateLimiter } from "../lib/rateLimit.js";
import { evaluateResumeText } from "../lib/resumeEvaluation.js";

export const resumesRouter = Router();
resumesRouter.use(requireAuth);

// Multer setup for in-memory file handling (10MB limit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (_req, file, cb) => {
    const lowerName = file.originalname.toLowerCase();
    const isPdf = file.mimetype === "application/pdf" || lowerName.endsWith(".pdf");
    const isDocx =
      file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.mimetype === "application/msword" ||
      lowerName.endsWith(".docx") ||
      lowerName.endsWith(".doc");

    if (isPdf || isDocx) {
      cb(null, true);
    } else {
      cb(new ApiError(400, "BAD_REQUEST", "Invalid file format. Only PDF and DOCX files are allowed."));
    }
  },
});

function handleMulterUpload(req: Request, res: Response, next: NextFunction) {
  upload.single("file")(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return next(new ApiError(413, "PAYLOAD_TOO_LARGE", "File size exceeds 10MB limit"));
        }
        return next(ApiError.badRequest(err.message));
      }
      return next(err);
    }
    if (!req.file) {
      return next(ApiError.badRequest("No file uploaded. Please attach a file under the 'file' field."));
    }
    next();
  });
}

// Multipart PDF/DOCX Resume Upload & Extraction
resumesRouter.post("/upload", handleMulterUpload, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = req.file!;
    const userId = req.user!.jobflowId;

    // 1. Real text extraction using pdf-parse or mammoth
    const extractedText = await ResumeParser.extractText(file.buffer, file.mimetype, file.originalname);

    // 2. Upload file to Supabase Storage via StorageService
    let publicUrl = "";
    try {
      const uploadRes = await StorageService.uploadResume(userId, file.originalname, file.buffer, file.mimetype);
      publicUrl = uploadRes.publicUrl;
    } catch (storageErr) {
      logger.warn({ err: storageErr }, "Supabase Storage upload warning (proceeding with DB text persistence)");
    }

    // 3. Persist record in PostgreSQL resumes table
    const resumeId = `res_${nanoid()}`;
    const resumeName = file.originalname || "Uploaded Resume";

    const [inserted] = await db
      .insert(resumes)
      .values({
        id: resumeId,
        userId: userId,
        name: resumeName,
        score: 0,
        ats: 0,
        text: extractedText,
        content: publicUrl ? { fileUrl: publicUrl } : null,
      })
      .returning();

    return res.status(201).json({
      resume: inserted,
    });
  } catch (error) {
    next(error);
  }
});

// Get all resumes for user
resumesRouter.get("/", async (req, res, next) => {
  try {
    const userResumes = await db
      .select()
      .from(resumes)
      .where(eq(resumes.userId, req.user!.jobflowId));

    res.status(200).json({ resumes: userResumes });
  } catch (error) {
    next(error);
  }
});

// Get single resume by ID
resumesRouter.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const [userResume] = await db
      .select()
      .from(resumes)
      .where(and(eq(resumes.id, id), eq(resumes.userId, req.user!.jobflowId)))
      .limit(1);

    if (!userResume) {
      return next(ApiError.notFound("Resume not found"));
    }

    res.status(200).json({ resume: userResume });
  } catch (error) {
    next(error);
  }
});

// Evaluate resume using Groq LLM
resumesRouter.post("/:id/evaluate", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.jobflowId;

    // 1. Rate Limiting per user identity with fallback safety
    let limitSuccess = true;
    let limitReset = 0;
    try {
      const limitResult = await copilotRateLimiter.limit(userId);
      limitSuccess = limitResult.success;
      limitReset = limitResult.reset;
    } catch (rateLimitErr) {
      logger.warn({ err: rateLimitErr, userId }, "Rate limiter fallback; allowing resume evaluation");
    }

    if (!limitSuccess) {
      logger.warn({ userId }, "Resume evaluation rate limit exceeded");
      res.set("Retry-After", Math.ceil((limitReset - Date.now()) / 1000).toString());
      return next(new ApiError(429, "RATE_LIMIT_EXCEEDED", "Evaluation rate limit exceeded. Please wait a moment before re-analyzing."));
    }

    // 2. Fetch resume with ownership verification
    const [resume] = await db
      .select()
      .from(resumes)
      .where(and(eq(resumes.id, id), eq(resumes.userId, userId)))
      .limit(1);

    if (!resume) {
      return next(ApiError.notFound("Resume not found"));
    }

    // 3. Fetch user's profile to obtain targetRole
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const targetRole = user?.targetRole || null;

    // 4. Run real evaluation
    const evaluation = await evaluateResumeText(resume.text, targetRole);

    if (evaluation.insufficientData) {
      return res.status(200).json({
        id: resume.id,
        insufficientData: true,
        message: evaluation.message,
      });
    }

    // 5. Persist real evaluation on resume record
    const existingContent = (typeof resume.content === "object" && resume.content !== null) ? resume.content : {};
    const updatedContent = {
      ...existingContent,
      evaluation: {
        contentClarity: evaluation.contentClarity,
        atsReadiness: evaluation.atsReadiness,
        roleAlignment: evaluation.roleAlignment,
        recommendation: evaluation.recommendation,
        evaluatedAt: new Date().toISOString(),
      },
    };

    const [updatedResume] = await db
      .update(resumes)
      .set({
        score: evaluation.contentClarity,
        ats: evaluation.atsReadiness,
        content: updatedContent,
        updatedAt: new Date(),
      })
      .where(and(eq(resumes.id, id), eq(resumes.userId, userId)))
      .returning();

    return res.status(200).json({
      id: resume.id,
      insufficientData: false,
      contentClarity: evaluation.contentClarity,
      atsReadiness: evaluation.atsReadiness,
      roleAlignment: evaluation.roleAlignment,
      recommendation: evaluation.recommendation,
      resume: updatedResume,
    });
  } catch (error) {
    next(error);
  }
});

// Add a resume (JSON metadata)
resumesRouter.post("/", validate({ 
  body: z.object({
    name: z.string().min(1),
    score: z.number().optional(),
    ats: z.number().optional(),
    text: z.string().optional(),
    content: z.record(z.string(), z.any()).optional()
  })
}), async (req, res, next) => {
  try {
    const resumeData = req.body;
    const resumeId = `res_${nanoid()}`;
    
    const [inserted] = await db.insert(resumes).values({
      id: resumeId,
      userId: req.user!.jobflowId,
      name: resumeData.name,
      score: resumeData.score || 0,
      ats: resumeData.ats || 0,
      text: resumeData.text || "",
      content: resumeData.content || null
    }).returning();

    res.status(201).json({ id: resumeId, resume: inserted });
  } catch (error) {
    next(error);
  }
});

// Update a resume
resumesRouter.put("/:id", validate({
  body: z.object({
    name: z.string().optional(),
    score: z.number().optional(),
    ats: z.number().optional(),
    text: z.string().optional(),
    content: z.record(z.string(), z.any()).optional()
  })
}), async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const [updated] = await db.update(resumes)
      .set({ ...updateData, updatedAt: new Date() })
      .where(and(eq(resumes.id, id), eq(resumes.userId, req.user!.jobflowId)))
      .returning();

    if (!updated) {
      return next(ApiError.notFound("Resume not found"));
    }

    res.status(200).json({ success: true, resume: updated });
  } catch (error) {
    next(error);
  }
});

// Delete a resume
resumesRouter.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const [deleted] = await db.delete(resumes)
      .where(and(eq(resumes.id, id), eq(resumes.userId, req.user!.jobflowId)))
      .returning();

    if (!deleted) {
      return next(ApiError.notFound("Resume not found"));
    }

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
});
