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
  DATABASE_URL: z.string().url()
});

export const env = envSchema.parse(process.env);
