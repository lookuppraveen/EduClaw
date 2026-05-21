import { env } from "../config/env.js";

type LogLevel = "debug" | "info" | "warn" | "error";

const order: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

const shouldLog = (level: LogLevel): boolean => {
  if (env.LOG_LEVEL === "silent") return false;
  return order[level] >= order[env.LOG_LEVEL];
};

export const logger = {
  debug(message: string, context: Record<string, unknown> = {}): void {
    if (shouldLog("debug")) console.debug(JSON.stringify({ level: "debug", message, ...context }));
  },
  info(message: string, context: Record<string, unknown> = {}): void {
    if (shouldLog("info")) console.info(JSON.stringify({ level: "info", message, ...context }));
  },
  warn(message: string, context: Record<string, unknown> = {}): void {
    if (shouldLog("warn")) console.warn(JSON.stringify({ level: "warn", message, ...context }));
  },
  error(message: string, context: Record<string, unknown> = {}): void {
    if (shouldLog("error")) console.error(JSON.stringify({ level: "error", message, ...context }));
  }
};
