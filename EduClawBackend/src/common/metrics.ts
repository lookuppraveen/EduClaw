import type { NextFunction, Request, Response } from "express";

interface HttpMetric {
  count: number;
  sumSeconds: number;
  buckets: number[];
}

const bucketsSeconds = [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5];
const httpMetrics = new Map<string, HttpMetric>();
let metricsStartedAt = Date.now();

const statusClass = (statusCode: number): string => `${Math.floor(statusCode / 100)}xx`;

const metricKey = (method: string, route: string, status: string): string =>
  `${method} ${route} ${status}`;

const labelValue = (value: string): string =>
  value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");

const routePattern = (req: Request): string => {
  const routePath = req.route?.path;
  if (typeof routePath === "string") {
    return `${req.baseUrl}${routePath}`;
  }

  return req.originalUrl.split("?")[0] ?? req.path;
};

const observeHttpRequest = (method: string, route: string, status: string, durationSeconds: number): void => {
  const key = metricKey(method, route, status);
  const metric = httpMetrics.get(key) ?? {
    count: 0,
    sumSeconds: 0,
    buckets: bucketsSeconds.map(() => 0)
  };

  metric.count += 1;
  metric.sumSeconds += durationSeconds;
  for (const [index, bucket] of bucketsSeconds.entries()) {
    if (durationSeconds <= bucket) {
      metric.buckets[index] += 1;
    }
  }

  httpMetrics.set(key, metric);
};

export const resetHttpMetrics = (): void => {
  httpMetrics.clear();
  metricsStartedAt = Date.now();
};

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startedAt = Date.now();

  res.on("finish", () => {
    observeHttpRequest(
      req.method,
      routePattern(req),
      statusClass(res.statusCode),
      (Date.now() - startedAt) / 1000
    );
  });

  next();
};

export const renderPrometheusMetrics = (): string => {
  const lines = [
    "# HELP educlaw_process_uptime_seconds Process uptime in seconds.",
    "# TYPE educlaw_process_uptime_seconds gauge",
    `educlaw_process_uptime_seconds ${((Date.now() - metricsStartedAt) / 1000).toFixed(3)}`,
    "# HELP educlaw_http_requests_total Total HTTP requests by method, route, and status class.",
    "# TYPE educlaw_http_requests_total counter",
    "# HELP educlaw_http_request_duration_seconds HTTP request duration histogram by method, route, and status class.",
    "# TYPE educlaw_http_request_duration_seconds histogram"
  ];

  for (const [key, metric] of [...httpMetrics.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    const [method, route, status] = key.split(" ");
    const labels = `method="${labelValue(method)}",route="${labelValue(route)}",status_class="${labelValue(status)}"`;

    lines.push(`educlaw_http_requests_total{${labels}} ${metric.count}`);

    for (const [index, bucket] of bucketsSeconds.entries()) {
      lines.push(`educlaw_http_request_duration_seconds_bucket{${labels},le="${bucket}"} ${metric.buckets[index]}`);
    }
    lines.push(`educlaw_http_request_duration_seconds_bucket{${labels},le="+Inf"} ${metric.count}`);
    lines.push(`educlaw_http_request_duration_seconds_sum{${labels}} ${metric.sumSeconds.toFixed(6)}`);
    lines.push(`educlaw_http_request_duration_seconds_count{${labels}} ${metric.count}`);
  }

  return `${lines.join("\n")}\n`;
};
