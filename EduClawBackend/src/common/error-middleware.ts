import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { HttpError } from "./errors.js";

export const errorMiddleware = (
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  if (error instanceof HttpError) {
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
