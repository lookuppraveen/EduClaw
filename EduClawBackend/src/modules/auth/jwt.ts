import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import type { JwtAccessPayload, JwtRefreshPayload } from "../../types/auth.js";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
  refreshJti: string;
}

const parseExpiry = (seconds: number): `${number}s` => `${seconds}s`;

export const signAccessToken = (payload: JwtAccessPayload): string => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    algorithm: "HS256",
    expiresIn: parseExpiry(env.JWT_ACCESS_TTL_SECONDS)
  });
};

export const signRefreshToken = (payload: JwtRefreshPayload): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    algorithm: "HS256",
    expiresIn: parseExpiry(env.JWT_REFRESH_TTL_SECONDS)
  });
};

export const verifyAccessToken = (token: string): JwtAccessPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtAccessPayload;
};

export const verifyRefreshToken = (token: string): JwtRefreshPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtRefreshPayload;
};
