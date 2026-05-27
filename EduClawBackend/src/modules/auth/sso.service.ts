import jwt from "jsonwebtoken";
import { HttpError } from "../../common/errors.js";

export type SsoProvider = "okta" | "azure-ad" | "shibboleth";

export interface InstitutionSsoConfig {
  issuer?: string;
  audience?: string;
  publicKey?: string;
}

export interface InstitutionSsoInput {
  provider: SsoProvider;
  idToken: string;
}

export interface InstitutionSsoIdentity {
  email: string;
  provider: SsoProvider;
  subject: string;
}

interface SsoIdTokenClaims extends jwt.JwtPayload {
  email?: string;
  preferred_username?: string;
  upn?: string;
}

const extractEmail = (claims: SsoIdTokenClaims): string | null => {
  const candidate = claims.email ?? claims.preferred_username ?? claims.upn;
  return typeof candidate === "string" && candidate.includes("@") ? candidate.toLowerCase() : null;
};

export const verifyInstitutionSsoIdToken = (
  input: InstitutionSsoInput,
  config: InstitutionSsoConfig
): InstitutionSsoIdentity => {
  if (!config.issuer || !config.audience || !config.publicKey) {
    throw new HttpError(503, "AUTH_PROVIDER_UNCONFIGURED", "Institution SSO is not configured");
  }

  try {
    const claims = jwt.verify(input.idToken, config.publicKey, {
      algorithms: ["RS256"],
      issuer: config.issuer,
      audience: config.audience
    }) as SsoIdTokenClaims;

    const email = extractEmail(claims);
    if (!claims.sub || !email) {
      throw new HttpError(401, "AUTH_INVALID_ID_TOKEN", "Institution SSO token is missing required identity claims");
    }

    return {
      email,
      provider: input.provider,
      subject: claims.sub
    };
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError(401, "AUTH_INVALID_ID_TOKEN", "Institution SSO token is invalid");
  }
};
