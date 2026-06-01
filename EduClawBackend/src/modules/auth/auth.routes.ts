import { Router } from "express";
import { z } from "zod";
import { env } from "../../config/env.js";
import { HttpError } from "../../common/errors.js";
import { newId, sha256 } from "../../common/crypto.js";
import { asyncHandler } from "../../common/async-handler.js";
import { findUserByEmail, findUserById } from "../../repositories/prisma/user.repository.js";
import { getSession, isRefreshTokenValid, revokeSession, saveSession } from "../../repositories/prisma/session.repository.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "./jwt.js";
import { verifyInstitutionSsoIdToken } from "./sso.service.js";
import type { JwtAccessPayload, JwtRefreshPayload, User } from "../../types/auth.js";

const loginSchema = z.object({
  provider: z.enum(["okta", "azure-ad", "shibboleth"]),
  idToken: z.string().min(1),
  email: z.string().email().optional(),
  device: z.string().min(1).optional()
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1)
});

const logoutSchema = z.object({
  refreshToken: z.string().min(1)
});

const mapUser = (user: User) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  roles: user.roles
});

const verifyRefreshTokenOrThrow = (refreshToken: string): JwtRefreshPayload => {
  try {
    return verifyRefreshToken(refreshToken);
  } catch {
    throw new HttpError(401, "AUTH_REFRESH_INVALID", "Refresh token is invalid");
  }
};

const issueTokens = async (userId: string, roles: JwtAccessPayload["roles"]) => {
  const refreshJti = newId();
  const accessToken = signAccessToken({ sub: userId, roles, type: "access" });
  const refreshToken = signRefreshToken({ sub: userId, type: "refresh", jti: refreshJti });
  const now = Date.now();
  await saveSession({
    id: refreshJti,
    userId,
    refreshTokenHash: sha256(refreshToken),
    createdAt: now,
    expiresAt: now + env.JWT_REFRESH_TTL_SECONDS * 1000
  });
  return {
    accessToken,
    refreshToken,
    expiresIn: env.JWT_ACCESS_TTL_SECONDS
  };
};

export const authRouter = Router();

authRouter.post("/login", asyncHandler(async (req, res) => {
  const body = loginSchema.parse(req.body);
  const email = env.AUTH_ALLOW_MOCK_SSO
    ? body.email
    : (await verifyInstitutionSsoIdToken(
        { provider: body.provider, idToken: body.idToken },
        {
          issuer: env.SSO_ISSUER,
          audience: env.SSO_AUDIENCE,
          publicKey: env.SSO_PUBLIC_KEY,
          jwksUri: env.SSO_JWKS_URI,
          jwksCacheTtlSeconds: env.SSO_JWKS_CACHE_TTL_SECONDS
        }
      )).email;

  if (!email) {
    throw new HttpError(400, "VALIDATION_ERROR", "Mock SSO login requires an explicit email");
  }

  const user = await findUserByEmail(email);

  if (!user) {
    throw new HttpError(401, "AUTH_INVALID_CREDENTIALS", "Invalid login credentials");
  }

  const tokens = await issueTokens(user.id, user.roles);
  return res.status(200).json({
    ...tokens,
    user: mapUser(user)
  });
}));

authRouter.post("/refresh", asyncHandler(async (req, res) => {
  const { refreshToken } = refreshSchema.parse(req.body);
  const payload = verifyRefreshTokenOrThrow(refreshToken);

  const session = await getSession(payload.jti);
  const isValid = await isRefreshTokenValid(payload.jti, refreshToken);
  if (!session || !isValid) {
    throw new HttpError(401, "AUTH_REFRESH_INVALID", "Refresh token is invalid");
  }

  const user = await findUserById(payload.sub);
  if (!user) {
    throw new HttpError(401, "AUTH_USER_NOT_FOUND", "User not found for session");
  }

  await revokeSession(payload.jti);
  const tokens = await issueTokens(user.id, user.roles);

  return res.status(200).json({
    ...tokens,
    user: mapUser(user)
  });
}));

authRouter.post("/logout", asyncHandler(async (req, res) => {
  const { refreshToken } = logoutSchema.parse(req.body);
  const payload = verifyRefreshTokenOrThrow(refreshToken);
  await revokeSession(payload.jti);
  return res.status(200).json({ success: true });
}));

export const meHandler = asyncHandler(async (req, res) => {
  const userId = req.authUser?.id;
  if (!userId) {
    throw new HttpError(401, "AUTH_UNAUTHORIZED", "Unauthorized");
  }

  const user = await findUserById(userId);
  if (!user) {
    throw new HttpError(404, "AUTH_USER_NOT_FOUND", "User not found");
  }

  return res.status(200).json({ user: mapUser(user) });
});
