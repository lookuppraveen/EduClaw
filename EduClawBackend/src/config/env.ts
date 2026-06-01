import dotenv from "dotenv";
import { z } from "zod";

if (process.env.NODE_ENV === "test") {
  dotenv.config({ path: ".env.test", override: true });
} else {
  dotenv.config();
}

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  JWT_REFRESH_TTL_SECONDS: z.coerce.number().int().positive().default(1209600),
  DATABASE_URL: z.string().url(),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(100),
  IDEMPOTENCY_TTL_MS: z.coerce.number().int().positive().default(600_000),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error", "silent"]).default("info"),
  AUTH_ALLOW_MOCK_SSO: z.enum(["true", "false"]).optional().transform((value) => value === "true"),
  SSO_ISSUER: z.string().url().optional(),
  SSO_AUDIENCE: z.string().min(1).optional(),
  SSO_PUBLIC_KEY: z.string().min(1).optional().transform((value) => value?.replace(/\\n/g, "\n")),
  SSO_JWKS_URI: z.string().url().optional(),
  SSO_JWKS_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(300)
});

const parsedEnv = envSchema.parse(process.env);

export const isMockSsoAllowed = (nodeEnv: string, configured: boolean): boolean => {
  return nodeEnv !== "production" && configured;
};

export const isInstitutionSsoConfigured = (
  issuer?: string,
  audience?: string,
  publicKey?: string,
  jwksUri?: string
): boolean => {
  return Boolean(issuer && audience && (publicKey || jwksUri));
};

export const env = {
  ...parsedEnv,
  AUTH_ALLOW_MOCK_SSO: isMockSsoAllowed(parsedEnv.NODE_ENV, parsedEnv.AUTH_ALLOW_MOCK_SSO),
  AUTH_INSTITUTION_SSO_CONFIGURED: isInstitutionSsoConfigured(
    parsedEnv.SSO_ISSUER,
    parsedEnv.SSO_AUDIENCE,
    parsedEnv.SSO_PUBLIC_KEY,
    parsedEnv.SSO_JWKS_URI
  )
};
