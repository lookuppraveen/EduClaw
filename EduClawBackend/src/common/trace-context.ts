import { randomBytes } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

const traceparentPattern = /^00-([a-f0-9]{32})-([a-f0-9]{16})-([a-f0-9]{2})$/;

const randomHex = (bytes: number): string => randomBytes(bytes).toString("hex");

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId: string | null;
  sampled: boolean;
}

export const traceContextMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const incoming = req.header("traceparent");
  const match = incoming?.match(traceparentPattern);
  const flags = match?.[3] ?? "01";

  const traceContext: TraceContext = {
    traceId: match?.[1] ?? randomHex(16),
    parentSpanId: match?.[2] ?? null,
    spanId: randomHex(8),
    sampled: (Number.parseInt(flags, 16) & 1) === 1
  };

  req.traceContext = traceContext;
  res.setHeader("traceparent", `00-${traceContext.traceId}-${traceContext.spanId}-${traceContext.sampled ? "01" : "00"}`);
  next();
};
