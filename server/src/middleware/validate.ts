import { Request, Response, NextFunction } from "express";
import { ZodError, ZodTypeAny, ZodObject } from "zod";
import { ApiError } from "../lib/ApiError.js";

interface ValidationSchema {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

export const validate = (schema: ValidationSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }
      if (schema.query) {
        req.query = schema.query.parse(req.query) as any;
      }
      if (schema.params) {
        req.params = schema.params.parse(req.params) as any;
      }
      next();
    } catch (error: any) {
      if (error instanceof ZodError || error?.name === "ZodError") {
        // Map Zod errors to standard ApiError details format
        const zErr = error as any;
        const issues = zErr.issues || zErr.errors || [];
        const details = issues.map((err: any) => ({
          path: err.path?.join?.(".") || "",
          message: err.message,
        }));
        return next(ApiError.badRequest("Invalid request data", details));
      }
      return next(error);
    }
  };
};
