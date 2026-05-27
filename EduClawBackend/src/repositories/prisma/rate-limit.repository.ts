import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma.js";

export interface RateLimitBucket {
  count: number;
  resetAt: Date;
}

const bucketId = (key: string): string => createHash("sha256").update(key).digest("hex");

export const deleteExpiredRateLimitBuckets = async (now: Date): Promise<void> => {
  await prisma.rateLimitBucket.deleteMany({
    where: {
      resetAt: {
        lte: now
      }
    }
  });
};

export const consumeRateLimitBucket = async (
  key: string,
  now: Date,
  windowMs: number
): Promise<RateLimitBucket> => {
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const id = bucketId(key);
    const existing = await tx.rateLimitBucket.findUnique({ where: { key: id } });
    if (!existing || existing.resetAt <= now) {
      const resetAt = new Date(now.getTime() + windowMs);
      const bucket = await tx.rateLimitBucket.upsert({
        where: { key: id },
        create: {
          key: id,
          count: 1,
          resetAt
        },
        update: {
          count: 1,
          resetAt
        }
      });

      return {
        count: bucket.count,
        resetAt: bucket.resetAt
      };
    }

    const bucket = await tx.rateLimitBucket.update({
      where: { key: id },
      data: {
        count: {
          increment: 1
        }
      }
    });

    return {
      count: bucket.count,
      resetAt: bucket.resetAt
    };
  });
};

export const resetRateLimitBuckets = async (): Promise<void> => {
  await prisma.rateLimitBucket.deleteMany();
};
