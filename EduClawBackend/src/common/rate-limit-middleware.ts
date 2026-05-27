import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { HttpError } from "./errors.js";
import {
  consumeRateLimitBucket,
  deleteExpiredRateLimitBuckets,
  resetRateLimitBuckets
} from "../repositories/prisma/rate-limit.repository.js";

const getClientKey = (req: Request): string => {
  const explicitClient = req.header("x-client-id");
  const principal = req.authUser?.id ?? explicitClient ?? req.ip ?? "unknown";
  return `${principal}:${req.method}:${req.path}`;
};

export const resetRateLimitState = async (): Promise<void> => {
  await resetRateLimitBuckets();
};

export const rateLimitMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const now = new Date();
    await deleteExpiredRateLimitBuckets(now);

    const bucket = await consumeRateLimitBucket(getClientKey(req), now, env.RATE_LIMIT_WINDOW_MS);

    const remaining = Math.max(0, env.RATE_LIMIT_MAX_REQUESTS - bucket.count);
    res.setHeader("RateLimit-Limit", env.RATE_LIMIT_MAX_REQUESTS.toString());
    res.setHeader("RateLimit-Remaining", remaining.toString());
    res.setHeader("RateLimit-Reset", Math.ceil(bucket.resetAt.getTime() / 1000).toString());

    if (bucket.count > env.RATE_LIMIT_MAX_REQUESTS) {
      next(new HttpError(429, "RATE_LIMITED", "Too many requests", {
        retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt.getTime() - now.getTime()) / 1000))
      }));
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};
