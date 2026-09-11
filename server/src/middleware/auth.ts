import { Request, Response, NextFunction } from "express";
import { supabase } from "../lib/supabase.js";
import { db } from "../db/index.js";
import { users } from "../db/schema/users.js";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger.js";
import { COOKIE_NAME } from "@shared/const.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        supabaseId: string;
        jobflowId: string;
        email: string | null;
      };
    }
  }
}

import { ApiError } from "../lib/ApiError.js";

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies[COOKIE_NAME];

  if (!token) {
    logger.warn("Authentication required: Missing session cookie");
    return next(ApiError.unauthorized("Authentication required"));
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authData.user) {
      logger.warn({ err: authError }, "Invalid or expired authentication");
      return next(ApiError.unauthorized("Invalid or expired authentication"));
    }

    const supabaseUser = authData.user;

    let [jobflowUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, supabaseUser.id))
      .limit(1);

    if (!jobflowUser) {
      // Profile is missing; synchronize/provision it atomically
      logger.info(
        { supabaseId: supabaseUser.id },
        "Provisioning missing Jobflow user record for authenticated session"
      );
      
      const email = supabaseUser.email;
      const name = supabaseUser.user_metadata?.name || email?.split("@")[0] || "Unknown";

      const [inserted] = await db.insert(users).values({
        id: supabaseUser.id,
        name,
        email,
      }).onConflictDoUpdate({
        target: users.id,
        set: { email }, // keep email synced
      }).returning();
      
      jobflowUser = inserted;
    }

    req.user = {
      supabaseId: supabaseUser.id,
      jobflowId: jobflowUser.id,
      email: jobflowUser.email,
    };

    next();
  } catch (error) {
    // Forward unexpected errors to the central error handler
    next(error);
  }
};
