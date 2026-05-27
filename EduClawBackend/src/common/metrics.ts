import type { NextFunction, Request, Response } from "express";
import { logger } from "./logger.js";
import { listHttpMetrics, observeHttpMetric, resetHttpMetricAggregates } from "../repositories/prisma/metrics.repository.js";

const bucketsSeconds = [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5];
let metricsStartedAt = Date.now();

const statusClass = (statusCode: number): string => `${Math.floor(statusCode / 100)}xx`;

const labelValue = (value: string): string =>
  value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");

const routePattern = (req: Request): string => {
  const routePath = req.route?.path;
  if (typeof routePath === "string") {
    return `${req.baseUrl}${routePath}`;
  }

  return req.originalUrl.split("?")[0] ?? req.path;
};

const bucketIndexForDuration = (durationSeconds: number): number | null => {
  const index = bucketsSeconds.findIndex((bucket) => durationSeconds <= bucket);
  return index === -1 ? null : index;
};

export const resetHttpMetrics = async (): Promise<void> => {
  await resetHttpMetricAggregates();
  metricsStartedAt = Date.now();
};

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startedAt = Date.now();

  res.on("finish", () => {
    const durationSeconds = (Date.now() - startedAt) / 1000;
    void observeHttpMetric({
      method: req.method,
      route: routePattern(req),
      statusClass: statusClass(res.statusCode),
      durationSeconds,
      bucketIndex: bucketIndexForDuration(durationSeconds),
      bucketCount: bucketsSeconds.length
    }).catch((error: unknown) => {
      logger.warn("Failed to persist HTTP metric", {
        error: error instanceof Error ? error.message : String(error)
      });
    });
  });

  next();
};

export const renderPrometheusMetrics = async (): Promise<string> => {
  const httpMetrics = await listHttpMetrics();
  const lines = [
    "# HELP educlaw_process_uptime_seconds Process uptime in seconds.",
    "# TYPE educlaw_process_uptime_seconds gauge",
    `educlaw_process_uptime_seconds ${((Date.now() - metricsStartedAt) / 1000).toFixed(3)}`,
    "# HELP educlaw_http_requests_total Total HTTP requests by method, route, and status class.",
    "# TYPE educlaw_http_requests_total counter",
    "# HELP educlaw_http_request_duration_seconds HTTP request duration histogram by method, route, and status class.",
    "# TYPE educlaw_http_request_duration_seconds histogram"
  ];

  for (const metric of httpMetrics) {
    const labels = `method="${labelValue(metric.method)}",route="${labelValue(metric.route)}",status_class="${labelValue(metric.statusClass)}"`;

    lines.push(`educlaw_http_requests_total{${labels}} ${metric.count}`);

    for (const [index, bucket] of bucketsSeconds.entries()) {
      lines.push(`educlaw_http_request_duration_seconds_bucket{${labels},le="${bucket}"} ${metric.bucketCounts[index] ?? 0}`);
    }
    lines.push(`educlaw_http_request_duration_seconds_bucket{${labels},le="+Inf"} ${metric.count}`);
    lines.push(`educlaw_http_request_duration_seconds_sum{${labels}} ${metric.sumSeconds.toFixed(6)}`);
    lines.push(`educlaw_http_request_duration_seconds_count{${labels}} ${metric.count}`);
  }

  return `${lines.join("\n")}\n`;
};
