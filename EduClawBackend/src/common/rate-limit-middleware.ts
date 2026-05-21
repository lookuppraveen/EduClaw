import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { HttpError } from "./errors.js";

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateLimitBucket>();

const getClientKey = (req: Request): string => {
  const explicitClient = req.header("x-client-id");
  const principal = req.authUser?.id ?? explicitClient ?? req.ip ?? "unknown";
  return `${principal}:${req.method}:${req.path}`;
};

const cleanupExpiredBuckets = (now: number): void => {
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
};

export const resetRateLimitState = (): void => {
  buckets.clear();
};

export const rateLimitMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const now = Date.now();
  cleanupExpiredBuckets(now);

  const key = getClientKey(req);
  const current = buckets.get(key);
  const bucket = current && current.resetAt > now
    ? current
    : { count: 0, resetAt: now + env.RATE_LIMIT_WINDOW_MS };

  bucket.count += 1;
  buckets.set(key, bucket);

  const remaining = Math.max(0, env.RATE_LIMIT_MAX_REQUESTS - bucket.count);
  res.setHeader("RateLimit-Limit", env.RATE_LIMIT_MAX_REQUESTS.toString());
  res.setHeader("RateLimit-Remaining", remaining.toString());
  res.setHeader("RateLimit-Reset", Math.ceil(bucket.resetAt / 1000).toString());

  if (bucket.count > env.RATE_LIMIT_MAX_REQUESTS) {
    next(new HttpError(429, "RATE_LIMITED", "Too many requests", {
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
    }));
    return;
  }

  next();
};
