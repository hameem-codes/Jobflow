import { Request, Response, NextFunction } from "express";
import { ApiError } from "../lib/ApiError.js";
import { logger } from "../lib/logger.js";
import { ZodError } from "zod";
import { PostgresError } from "postgres"; // Assuming drizzle handles it this way, wait drizzle uses `pg` mostly, but maybe standard Error structure. We will check error.code.

export const errorHandler = (
  err: Error | ApiError | unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // 1. Handle our custom ApiError
  if (err instanceof ApiError) {
    // We log 5xx errors with stack, but just info/warn 4xx errors
    if (err.statusCode >= 500) {
      logger.error({ err, path: req.path }, "API Error (5xx)");
    } else {
      logger.info({ msg: err.message, code: err.errorCode, path: req.path }, "API Error (4xx)");
    }

    return res.status(err.statusCode).json({
      error: {
        code: err.errorCode,
        message: err.message,
        details: err.details,
      },
    });
  }

  // 2. Handle raw ZodErrors (if any slipped past `validate` middleware somehow)
  if (err instanceof ZodError) {
    logger.warn({ err, path: req.path }, "Uncaught Zod validation error");
    const zErr = err as any;
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        details: zErr.errors.map((e: any) => ({ path: e.path.join("."), message: e.message })),
      },
    });
  }

  // 3. Handle Database Errors (Postgres typically has `.code`)
  // 23505 = unique_violation, 23503 = foreign_key_violation
  const pgError = err as any;
  if (pgError && typeof pgError.code === "string" && pgError.code.length === 5) {
    if (pgError.code === "23505") {
      logger.warn({ path: req.path, constraint: pgError.constraint }, "Database unique constraint violation");
      return res.status(409).json({
        error: {
          code: "CONFLICT",
          message: "A resource with this identifier already exists",
        },
      });
    }
    // For other DB errors, do NOT leak to client, fallback to 500.
    logger.error({ err, path: req.path }, "Unhandled Database Error");
  } else if (err instanceof Error) {
    // 4. Handle standard uncaught exceptions
    logger.error({ err, path: req.path }, "Unhandled Exception");
  } else {
    // 5. Handle unknown thrown values
    logger.error({ err, path: req.path }, "Unknown Thrown Value");
  }

  // Final fallback response (Safe 500)
  return res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal server error",
    },
  });
};
