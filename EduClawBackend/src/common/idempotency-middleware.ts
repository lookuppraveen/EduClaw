import { createHash } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { HttpError } from "./errors.js";
import {
  deleteExpiredIdempotencyRecords,
  getIdempotencyRecord,
  resetIdempotencyRecords,
  saveIdempotencyRecord
} from "../repositories/prisma/idempotency.repository.js";

const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const protectedPathPrefixes = [
  "/api/v1/consents",
  "/api/v1/learners",
  "/api/v1/conversations",
  "/api/v1/policies",
  "/api/v1/reviews",
  "/api/v1/admin/integrations"
];

const stableStringify = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
};

const sha256 = (value: string): string => createHash("sha256").update(value).digest("hex");

const shouldProtect = (req: Request): boolean => {
  const path = req.originalUrl.split("?")[0] ?? req.path;
  return unsafeMethods.has(req.method) && protectedPathPrefixes.some((prefix) => path.startsWith(prefix));
};

const buildStoreKey = (req: Request, idempotencyKey: string) => {
  const principal = req.authUser?.id ?? sha256(req.header("authorization") ?? req.ip ?? "anonymous");
  const path = req.originalUrl.split("?")[0] ?? req.path;
  return {
    principal,
    method: req.method,
    path,
    idempotencyKey
  };
};

export const resetIdempotencyState = async (): Promise<void> => {
  await resetIdempotencyRecords();
};

export const idempotencyMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!shouldProtect(req)) {
    next();
    return;
  }

  const idempotencyKey = req.header("idempotency-key");
  if (!idempotencyKey) {
    next();
    return;
  }

  try {
    const now = new Date();
    await deleteExpiredIdempotencyRecords(now);

    const storeKey = buildStoreKey(req, idempotencyKey);
    const bodyHash = sha256(stableStringify(req.body ?? null));
    const existing = await getIdempotencyRecord(storeKey);

    if (existing) {
      if (existing.bodyHash !== bodyHash) {
        next(new HttpError(409, "IDEMPOTENCY_CONFLICT", "Idempotency key was reused with a different request body"));
        return;
      }

      res.setHeader("Idempotency-Replayed", "true");
      res.status(existing.statusCode).json(existing.responseBody);
      return;
    }

    const originalJson = res.json.bind(res);
    res.json = (body: unknown): Response => {
      if (res.statusCode < 500) {
        void saveIdempotencyRecord({
          ...storeKey,
          bodyHash,
          expiresAt: new Date(Date.now() + env.IDEMPOTENCY_TTL_MS),
          statusCode: res.statusCode,
          responseBody: body
        })
          .then(() => originalJson(body))
          .catch(next);
        return res;
      }

      return originalJson(body);
    };

    next();
  } catch (error) {
    next(error);
  }
};
