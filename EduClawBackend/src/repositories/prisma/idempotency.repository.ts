import type { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma.js";

export interface IdempotencyRecordKey {
  principal: string;
  method: string;
  path: string;
  idempotencyKey: string;
}

export interface IdempotencyRecord {
  bodyHash: string;
  statusCode: number;
  responseBody: unknown;
  expiresAt: string;
}

export interface SaveIdempotencyRecordInput extends IdempotencyRecordKey {
  bodyHash: string;
  statusCode: number;
  responseBody: unknown;
  expiresAt: Date;
}

const recordId = (key: IdempotencyRecordKey): string =>
  `${key.principal}:${key.method}:${key.path}:${key.idempotencyKey}`;

export const deleteExpiredIdempotencyRecords = async (now: Date): Promise<void> => {
  await prisma.idempotencyRecord.deleteMany({
    where: {
      expiresAt: {
        lte: now
      }
    }
  });
};

export const getIdempotencyRecord = async (key: IdempotencyRecordKey): Promise<IdempotencyRecord | null> => {
  const row = await prisma.idempotencyRecord.findUnique({
    where: {
      principal_method_path_idempotencyKey: key
    }
  });

  if (!row) {
    return null;
  }

  return {
    bodyHash: row.bodyHash,
    statusCode: row.statusCode,
    responseBody: row.responseBody,
    expiresAt: row.expiresAt.toISOString()
  };
};

export const saveIdempotencyRecord = async (input: SaveIdempotencyRecordInput): Promise<void> => {
  await prisma.idempotencyRecord.upsert({
    where: {
      principal_method_path_idempotencyKey: {
        principal: input.principal,
        method: input.method,
        path: input.path,
        idempotencyKey: input.idempotencyKey
      }
    },
    create: {
      id: recordId(input),
      principal: input.principal,
      method: input.method,
      path: input.path,
      idempotencyKey: input.idempotencyKey,
      bodyHash: input.bodyHash,
      statusCode: input.statusCode,
      responseBody: input.responseBody as Prisma.InputJsonValue,
      expiresAt: input.expiresAt
    },
    update: {
      bodyHash: input.bodyHash,
      statusCode: input.statusCode,
      responseBody: input.responseBody as Prisma.InputJsonValue,
      expiresAt: input.expiresAt
    }
  });
};

export const resetIdempotencyRecords = async (): Promise<void> => {
  await prisma.idempotencyRecord.deleteMany();
};
