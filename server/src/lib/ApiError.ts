export class ApiError extends Error {
  public statusCode: number;
  public errorCode: string;
  public details?: unknown[];

  constructor(statusCode: number, errorCode: string, message: string, details?: unknown[]) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;

    // Maintain V8 stack trace natively
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  // Common errors for easy creation
  static badRequest(message: string, details?: unknown[]) {
    return new ApiError(400, "BAD_REQUEST", message, details);
  }

  static unauthorized(message = "Authentication required") {
    return new ApiError(401, "UNAUTHORIZED", message);
  }

  static forbidden(message = "Insufficient permissions") {
    return new ApiError(403, "FORBIDDEN", message);
  }

  static notFound(message = "Resource not found") {
    return new ApiError(404, "NOT_FOUND", message);
  }

  static conflict(message: string) {
    return new ApiError(409, "CONFLICT", message);
  }

  static internal(message = "Internal server error") {
    return new ApiError(500, "INTERNAL_SERVER_ERROR", message);
  }

  static serviceUnavailable(message = "Service unavailable") {
    return new ApiError(503, "SERVICE_UNAVAILABLE", message);
  }
}
