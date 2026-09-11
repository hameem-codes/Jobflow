import { Router } from "express";
import { supabase, supabaseAdmin } from "../lib/supabase.js";
import { db } from "../db/index.js";
import { users } from "../db/schema/users.js";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger.js";
import { requireAuth } from "../middleware/auth.js";
import { setCsrfCookie, clearCsrfCookie } from "../middleware/csrf.js";
import { validate } from "../middleware/validate.js";
import { ApiError } from "../lib/ApiError.js";
import { COOKIE_NAME } from "@shared/const.js";
import { env } from "../config/env.js";
import { z } from "zod";

export const authRouter = Router();

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: "/",
};

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Signup
authRouter.post("/signup", validate({ body: signupSchema }), async (req, res, next) => {
  const { email, password, name } = req.body;

  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    let supabaseUser = authData?.user;

    // Supabase Auth returns a user object with empty identities array if the user already exists
    if (supabaseUser && supabaseUser.identities && supabaseUser.identities.length === 0) {
      logger.warn({ email }, "Signup rejected: user already registered");
      return next(ApiError.badRequest("User already registered"));
    }

    if (authError || !supabaseUser) {
      if (authError?.message?.includes("rate limit") || authError?.status === 429) {
        logger.info("Supabase public signup rate limited; creating confirmed user via admin client");
        const { data: adminData, error: adminError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { name },
        });
        if (adminError || !adminData.user) {
          logger.warn({ err: adminError || authError }, "Supabase signup failed");
          return next(ApiError.badRequest(adminError?.message || authError?.message || "User already registered or signup failed"));
        }
        supabaseUser = adminData.user;
      } else {
        logger.warn({ err: authError }, "Supabase signup failed");
        return next(ApiError.badRequest(authError?.message || "Signup failed"));
      }
    }

    let session = authData?.session;

    // If project requires confirmation, auto-confirm and acquire active session
    if (!session) {
      try {
        await supabaseAdmin.auth.admin.updateUserById(supabaseUser.id, {
          email_confirm: true,
        });
        const { data: signInData } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInData?.session) {
          session = signInData.session;
        }
      } catch (confirmErr) {
        logger.warn({ err: confirmErr }, "Failed to auto-confirm user session");
      }
    }

    // 2. Provision Jobflow user
    // We use insert on conflict do nothing in case of race conditions
    const [jobflowUser] = await db.insert(users).values({
      id: supabaseUser.id,
      name,
      email,
    }).onConflictDoUpdate({
      target: users.id,
      set: { name, email },
    }).returning();

    // 3. Set auth session cookie
    if (session?.access_token) {
      res.cookie(COOKIE_NAME, session.access_token, cookieOptions);
      setCsrfCookie(res);
    }

    return res.status(201).json({
      user: {
        id: jobflowUser.id,
        name: jobflowUser.name,
        email: jobflowUser.email,
      }
    });
  } catch (error) {
    next(error);
  }
});

// Login
authRouter.post("/login", validate({ body: loginSchema }), async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.session) {
      logger.warn({ err: authError }, "Supabase login failed");
      return next(ApiError.unauthorized("Invalid email or password"));
    }

    // Ensure Jobflow user exists
    const [jobflowUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, authData.user.id))
      .limit(1);

    if (!jobflowUser) {
      // Provision missing user
      await db.insert(users).values({
        id: authData.user.id,
        name: authData.user.user_metadata?.name || "Unknown",
        email: authData.user.email,
      });
    }

    // Set session cookie
    res.cookie(COOKIE_NAME, authData.session.access_token, cookieOptions);
    setCsrfCookie(res);

    return res.status(200).json({
      user: {
        id: authData.user.id,
        email: authData.user.email,
      }
    });
  } catch (error) {
    next(error);
  }
});

// Logout
authRouter.post("/logout", async (_req, res, next) => {
  try {
    res.clearCookie(COOKIE_NAME, { path: "/" });
    clearCsrfCookie(res);
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
});

// Get current user (protected)
authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const [userRecord] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user!.jobflowId))
      .limit(1);

    if (!userRecord) {
      return next(ApiError.notFound("User record not found"));
    }

    return res.status(200).json({
      user: {
        ...userRecord,
        supabaseId: req.user!.supabaseId,
      }
    });
  } catch (error) {
    next(error);
  }
});

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  title: z.string().optional(),
  locationPreference: z.string().optional(),
  targetRole: z.string().optional(),
});

// Update current user (protected)
authRouter.put("/me", requireAuth, validate({ body: updateProfileSchema }), async (req, res, next) => {
  try {
    const { name, title, locationPreference, targetRole } = req.body;
    
    const [updatedUser] = await db
      .update(users)
      .set({ 
        name: name !== undefined ? name : undefined,
        title: title !== undefined ? title : undefined,
        locationPreference: locationPreference !== undefined ? locationPreference : undefined,
        targetRole: targetRole !== undefined ? targetRole : undefined,
        updatedAt: new Date(),
      })
      .where(eq(users.id, req.user!.jobflowId))
      .returning();

    return res.status(200).json({
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
});
