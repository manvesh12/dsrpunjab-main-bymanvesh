import type { NextFunction, Request, Response } from "express";
import { environment } from "../../config/environment.js";
import { ApiError } from "../exceptions/api-error.js";
import { logger } from "../logging/logger.js";

export function globalErrorHandler(error: Error, req: Request, res: Response, _next: NextFunction) {
  const apiError = error instanceof ApiError ? error : null;
  const parserError = error as Error & { status?: number; type?: string };
  const payloadTooLarge =
    parserError.status === 413 || parserError.type === "entity.too.large";
  const status = apiError?.status || (payloadTooLarge ? 413 : 500);
  const message = apiError?.message ||
    (payloadTooLarge ? "Request payload is too large" : "Internal server error");
  const code = apiError?.code ||
    (payloadTooLarge ? "PAYLOAD_TOO_LARGE" : "INTERNAL_ERROR");

  logger.error("request_failed", {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    status,
    errorName: error.name,
    errorMessage: error.message,
    stack: environment.isProduction ? undefined : error.stack
  });

  res.status(status).json({
    error: message,
    code,
    requestId: req.requestId,
    ...(apiError?.details === undefined ? {} : { details: apiError.details })
  });
}
