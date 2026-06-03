import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { HttpError } from "./errors.js";
import {
  consumeRateLimitBucket,
  deleteExpiredRateLimitBuckets,
  resetRateLimitBuckets
} from "../repositories/prisma/rate-limit.repository.js";
import { verifyAccessToken } from "../modules/auth/jwt.js";

const extractBearerToken = (authorization?: string): string | null => {
  if (!authorization) return null;
  const [scheme, token] = authorization.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
};

const getAuthenticatedPrincipal = (req: Request): string | null => {
  if (req.authUser?.id) {
    return req.authUser.id;
  }

  const token = extractBearerToken(req.header("authorization"));
  if (!token) {
    return null;
  }

  try {
    const payload = verifyAccessToken(token);
    return payload.type === "access" ? payload.sub : null;
  } catch {
    return null;
  }
};

const getClientKey = (req: Request): string => {
  const explicitClient = req.header("x-client-id");
  const principal = getAuthenticatedPrincipal(req) ?? explicitClient ?? req.ip ?? "unknown";
  return `${principal}:${req.method}:${req.path}`;
};

const isProbeRequest = (req: Request): boolean => {
  return req.method === "GET" && (req.path === "/api/v1/health" || req.path === "/api/v1/ready");
};

export const resetRateLimitState = async (): Promise<void> => {
  await resetRateLimitBuckets();
};

export const rateLimitMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (isProbeRequest(req)) {
    next();
    return;
  }

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
