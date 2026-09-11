import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { logger } from "../lib/logger.js";

const CSRF_COOKIE_NAME = "csrf-token";
const CSRF_HEADER_NAME = "x-csrf-token";

// List of HTTP methods that require CSRF validation (state-changing methods)
const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];

import { ApiError } from "../lib/ApiError.js";

/**
 * Validates the CSRF token on state-changing requests.
 * Uses Double Submit Cookie pattern.
 */
export const validateCsrf = (req: Request, res: Response, next: NextFunction) => {
  if (!req.cookies[CSRF_COOKIE_NAME]) {
    setCsrfCookie(res);
  }

  if (SAFE_METHODS.includes(req.method)) {
    return next();
  }

  // Exempt unauthenticated entrypoints and signature-verified webhooks
  if (
    req.path.startsWith("/auth/signup") ||
    req.path.startsWith("/auth/login") ||
    req.path.startsWith("/auth/logout") ||
    req.path.startsWith("/webhooks")
  ) {
    return next();
  }

  const cookieToken = req.cookies[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME];

  if (!cookieToken || !headerToken) {
    logger.warn("CSRF validation failed: Missing token in cookie or header");
    return next(ApiError.forbidden("Invalid CSRF token"));
  }

  // Use timing-safe equal to prevent timing attacks, though this is a random string
  if (
    cookieToken.length !== headerToken.length ||
    !crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken as string))
  ) {
    logger.warn("CSRF validation failed: Token mismatch");
    return next(ApiError.forbidden("Invalid CSRF token"));
  }

  next();
};

/**
 * Helper to generate and set a new CSRF token on the response.
 * This should be called when authenticating (e.g. login/signup).
 */
export const setCsrfCookie = (res: Response) => {
  const token = crypto.randomBytes(32).toString("hex");
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Must be readable by frontend JS
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // Must match auth cookie logic roughly
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: "/",
  });
};

/**
 * Helper to clear the CSRF cookie on logout
 */
export const clearCsrfCookie = (res: Response) => {
  res.clearCookie(CSRF_COOKIE_NAME, {
    path: "/",
  });
};
