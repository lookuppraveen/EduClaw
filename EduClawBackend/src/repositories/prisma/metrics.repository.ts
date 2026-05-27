import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma.js";

export interface HttpMetricAggregate {
  method: string;
  route: string;
  statusClass: string;
  count: number;
  sumSeconds: number;
  bucketCounts: number[];
}

export interface ObserveHttpMetricInput {
  method: string;
  route: string;
  statusClass: string;
  durationSeconds: number;
  bucketIndex: number | null;
  bucketCount: number;
}

const metricId = (method: string, route: string, statusClass: string): string =>
  createHash("sha256").update(`${method}:${route}:${statusClass}`).digest("hex");

const zeroBuckets = (bucketCount: number): number[] => Array.from({ length: bucketCount }, () => 0);

const incrementBuckets = (bucketCounts: number[], bucketIndex: number | null, bucketCount: number): number[] => {
  const next = bucketCounts.length === bucketCount ? [...bucketCounts] : zeroBuckets(bucketCount);
  if (bucketIndex === null) {
    return next;
  }

  for (let index = bucketIndex; index < next.length; index += 1) {
    next[index] += 1;
  }

  return next;
};

export const observeHttpMetric = async (input: ObserveHttpMetricInput): Promise<void> => {
  const bucketCounts = incrementBuckets(zeroBuckets(input.bucketCount), input.bucketIndex, input.bucketCount);

  await prisma.$executeRaw`
    INSERT INTO "HttpMetric" (
      "id",
      "method",
      "route",
      "statusClass",
      "count",
      "sumSeconds",
      "bucketCounts",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      ${metricId(input.method, input.route, input.statusClass)},
      ${input.method},
      ${input.route},
      ${input.statusClass},
      1,
      ${input.durationSeconds},
      ARRAY[${Prisma.join(bucketCounts)}]::integer[],
      now(),
      now()
    )
    ON CONFLICT ("method", "route", "statusClass")
    DO UPDATE SET
      "count" = "HttpMetric"."count" + 1,
      "sumSeconds" = "HttpMetric"."sumSeconds" + ${input.durationSeconds},
      "bucketCounts" = ARRAY(
        SELECT COALESCE("HttpMetric"."bucketCounts"[index], 0) + EXCLUDED."bucketCounts"[index]
        FROM generate_subscripts(EXCLUDED."bucketCounts", 1) AS index
      ),
      "updatedAt" = now()
  `;
};

export const listHttpMetrics = async (): Promise<HttpMetricAggregate[]> => {
  const rows = await prisma.httpMetric.findMany({
    orderBy: [
      { method: "asc" },
      { route: "asc" },
      { statusClass: "asc" }
    ]
  });

  return rows.map((row) => ({
    method: row.method,
    route: row.route,
    statusClass: row.statusClass,
    count: row.count,
    sumSeconds: row.sumSeconds,
    bucketCounts: row.bucketCounts
  }));
};

export const resetHttpMetricAggregates = async (): Promise<void> => {
  await prisma.httpMetric.deleteMany();
};
