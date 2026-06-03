import type { CorsOptions } from "cors";

type CorsConfig = {
  allowedOrigins: string[];
  nodeEnv: string;
};

export const parseAllowedOrigins = (value?: string): string[] => {
  if (!value) return [];

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
};

export const buildCorsOptions = ({ allowedOrigins, nodeEnv }: CorsConfig): CorsOptions => {
  if (allowedOrigins.length === 0) {
    return {
      origin: nodeEnv === "production" ? false : true
    };
  }

  const allowed = new Set(allowedOrigins);

  return {
    origin: (origin, callback) => {
      if (!origin || allowed.has(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    }
  };
};
