import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { HttpError } from "./errors.js";
import { logger } from "./logger.js";

export const errorMiddleware = (
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  if (error instanceof HttpError) {
    logger.warn("http_error", {
      requestId: req.requestId ?? null,
      code: error.code,
      statusCode: error.statusCode,
      path: req.originalUrl,
      traceId: req.traceContext?.traceId ?? null
    });

    return res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details ?? null,
        requestId: req.requestId ?? null,
        timestamp: new Date().toISOString()
      }
    });
  }

  if (error instanceof ZodError) {
    logger.warn("validation_error", {
      requestId: req.requestId ?? null,
      path: req.originalUrl,
      issueCount: error.issues.length,
      traceId: req.traceContext?.traceId ?? null
    });

    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: error.issues,
        requestId: req.requestId ?? null,
        timestamp: new Date().toISOString()
      }
    });
  }

  logger.error("unhandled_error", {
    requestId: req.requestId ?? null,
    path: req.originalUrl,
    message: error instanceof Error ? error.message : "Unknown error",
    traceId: req.traceContext?.traceId ?? null
  });

  return res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Unexpected server error",
      details: null,
      requestId: req.requestId ?? null,
      timestamp: new Date().toISOString()
    }
  });
};
