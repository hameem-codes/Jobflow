import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { db } from "../db/index.js";
import { letters } from "../db/schema/letters.js";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export const lettersRouter = Router();
lettersRouter.use(requireAuth);

// Get all letters for the user
lettersRouter.get("/", async (req, res, next) => {
  try {
    const userLetters = await db
      .select()
      .from(letters)
      .where(eq(letters.userId, req.user!.jobflowId));

    res.status(200).json(userLetters);
  } catch (error) {
    next(error);
  }
});

// Create a new letter
lettersRouter.post("/", validate({
  body: z.object({
    jobId: z.string().optional(),
    content: z.string(),
    status: z.string().optional()
  })
}), async (req, res, next) => {
  try {
    const letterData = req.body;
    const letterId = `letter_${nanoid()}`;
    
    await db.insert(letters).values({
      id: letterId,
      userId: req.user!.jobflowId,
      ...letterData
    });

    res.status(201).json({ id: letterId });
  } catch (error) {
    next(error);
  }
});

// Update a letter
lettersRouter.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    await db.update(letters).set({ ...req.body, updatedAt: new Date() }).where(eq(letters.id, id));
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Delete a letter
lettersRouter.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    await db.delete(letters).where(eq(letters.id, id));
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
});
