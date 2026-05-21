import type { NextFunction, Request, Response } from "express";
import { logger } from "./logger.js";

export const requestLoggerMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startedAt = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";

    logger[level]("http_request", {
      requestId: req.requestId ?? null,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
      userId: req.authUser?.id ?? null,
      traceId: req.traceContext?.traceId ?? null,
      spanId: req.traceContext?.spanId ?? null
    });
  });

  next();
};
