import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../../common/errors.js";
import { verifyAccessToken } from "./jwt.js";

const extractBearerToken = (authorization?: string): string | null => {
  if (!authorization) return null;
  const [scheme, token] = authorization.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
};

export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const token = extractBearerToken(req.header("authorization"));
    if (!token) {
      throw new HttpError(401, "AUTH_UNAUTHORIZED", "Missing bearer token");
    }

    const payload = verifyAccessToken(token);
    if (payload.type !== "access") {
      throw new HttpError(401, "AUTH_UNAUTHORIZED", "Invalid access token type");
    }

    req.authUser = {
      id: payload.sub,
      roles: payload.roles
    };

    next();
  } catch {
    next(new HttpError(401, "AUTH_UNAUTHORIZED", "Invalid or expired access token"));
  }
};
