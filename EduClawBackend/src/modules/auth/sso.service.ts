import jwt from "jsonwebtoken";
import { createPublicKey, type JsonWebKey } from "node:crypto";
import { HttpError } from "../../common/errors.js";
import { resetCircuitBreakers, runWithRetryAndCircuitBreaker } from "../../common/resilience.js";

export type SsoProvider = "okta" | "azure-ad" | "shibboleth";

export interface InstitutionSsoConfig {
  issuer?: string;
  audience?: string;
  publicKey?: string;
  jwksUri?: string;
  jwksCacheTtlSeconds?: number;
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

interface JsonWebKeySet {
  keys?: JsonWebKey[];
}

interface CachedJwks {
  expiresAt: number;
  keys: JsonWebKey[];
}

const jwksCache = new Map<string, CachedJwks>();

const extractEmail = (claims: SsoIdTokenClaims): string | null => {
  const candidate = claims.email ?? claims.preferred_username ?? claims.upn;
  return typeof candidate === "string" && candidate.includes("@") ? candidate.toLowerCase() : null;
};

const fetchJwks = async (jwksUri: string, ttlSeconds: number): Promise<JsonWebKey[]> => {
  const cached = jwksCache.get(jwksUri);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.keys;
  }

  const response = await runWithRetryAndCircuitBreaker(
    async () => await fetch(jwksUri),
    {
      circuitName: `sso-jwks:${jwksUri}`,
      maxAttempts: 2,
      retryDelayMs: 50,
      failureThreshold: 3,
      openMs: 30_000
    }
  );
  if (!response.ok) {
    throw new HttpError(503, "AUTH_PROVIDER_UNAVAILABLE", "Institution SSO JWKS endpoint is unavailable");
  }

  const jwks = await response.json() as JsonWebKeySet;
  if (!Array.isArray(jwks.keys)) {
    throw new HttpError(503, "AUTH_PROVIDER_INVALID_JWKS", "Institution SSO JWKS response is invalid");
  }

  jwksCache.set(jwksUri, {
    expiresAt: Date.now() + ttlSeconds * 1000,
    keys: jwks.keys
  });
  return jwks.keys;
};

const resolveVerificationKey = async (input: InstitutionSsoInput, config: InstitutionSsoConfig): Promise<string> => {
  if (config.publicKey) {
    return config.publicKey;
  }

  if (!config.jwksUri) {
    throw new HttpError(503, "AUTH_PROVIDER_UNCONFIGURED", "Institution SSO is not configured");
  }

  const decoded = jwt.decode(input.idToken, { complete: true });
  const kid = decoded && typeof decoded === "object" ? decoded.header.kid : undefined;
  if (!kid) {
    throw new HttpError(401, "AUTH_INVALID_ID_TOKEN", "Institution SSO token is missing a key id");
  }

  const keys = await fetchJwks(config.jwksUri, config.jwksCacheTtlSeconds ?? 300);
  const jwk = keys.find((key) => key.kid === kid && key.kty === "RSA");
  if (!jwk) {
    throw new HttpError(401, "AUTH_INVALID_ID_TOKEN", "Institution SSO token key is not trusted");
  }

  return createPublicKey({ key: jwk, format: "jwk" }).export({ type: "spki", format: "pem" }).toString();
};

export const resetSsoJwksCache = (): void => {
  jwksCache.clear();
  resetCircuitBreakers();
};

export const verifyInstitutionSsoIdToken = async (
  input: InstitutionSsoInput,
  config: InstitutionSsoConfig
): Promise<InstitutionSsoIdentity> => {
  if (!config.issuer || !config.audience || (!config.publicKey && !config.jwksUri)) {
    throw new HttpError(503, "AUTH_PROVIDER_UNCONFIGURED", "Institution SSO is not configured");
  }

  try {
    const verificationKey = await resolveVerificationKey(input, config);
    const claims = jwt.verify(input.idToken, verificationKey, {
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
