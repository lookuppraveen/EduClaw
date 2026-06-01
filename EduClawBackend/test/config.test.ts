import { afterEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import { generateKeyPairSync } from "node:crypto";
import { env, isInstitutionSsoConfigured, isMockSsoAllowed } from "../src/config/env.js";
import { HttpError } from "../src/common/errors.js";
import { resetSsoJwksCache, verifyInstitutionSsoIdToken } from "../src/modules/auth/sso.service.js";

afterEach(() => {
  resetSsoJwksCache();
  vi.unstubAllGlobals();
});

describe("environment config", () => {
  it("allows mock SSO only when explicitly enabled outside production", () => {
    expect(isMockSsoAllowed("test", true)).toBe(true);
    expect(isMockSsoAllowed("development", true)).toBe(true);
    expect(isMockSsoAllowed("test", false)).toBe(false);
    expect(isMockSsoAllowed("production", true)).toBe(false);
  });

  it("opts test environment into mock SSO explicitly", () => {
    expect(env.NODE_ENV).toBe("test");
    expect(env.AUTH_ALLOW_MOCK_SSO).toBe(true);
  });

  it("detects complete institution SSO configuration", () => {
    expect(isInstitutionSsoConfigured("https://idp.example.edu", "educlaw", "public-key")).toBe(true);
    expect(isInstitutionSsoConfigured("https://idp.example.edu", "educlaw", undefined, "https://idp.example.edu/jwks")).toBe(true);
    expect(isInstitutionSsoConfigured("https://idp.example.edu", "educlaw", undefined, undefined)).toBe(false);
  });

  it("verifies institution SSO tokens with issuer, audience, and public key", async () => {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const issuer = "https://idp.example.edu";
    const audience = "educlaw";
    const idToken = jwt.sign(
      {
        sub: "idp-user-123",
        email: "MAYA@EXAMPLE.EDU"
      },
      privateKey,
      {
        algorithm: "RS256",
        issuer,
        audience,
        expiresIn: "5m"
      }
    );

    const identity = await verifyInstitutionSsoIdToken(
      { provider: "okta", idToken },
      {
        issuer,
        audience,
        publicKey: publicKey.export({ type: "spki", format: "pem" }).toString()
      }
    );

    expect(identity).toEqual({
      email: "maya@example.edu",
      provider: "okta",
      subject: "idp-user-123"
    });
  });

  it("verifies institution SSO tokens using JWKS key discovery", async () => {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const issuer = "https://idp.example.edu";
    const audience = "educlaw";
    const jwk = {
      ...publicKey.export({ format: "jwk" }),
      kid: "test-key-1",
      use: "sig",
      alg: "RS256"
    };
    const idToken = jwt.sign(
      {
        sub: "idp-user-456",
        preferred_username: "JORDAN@EXAMPLE.EDU"
      },
      privateKey,
      {
        algorithm: "RS256",
        issuer,
        audience,
        expiresIn: "5m",
        keyid: "test-key-1"
      }
    );

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ keys: [jwk] })
    });
    vi.stubGlobal("fetch", fetchMock);

    const identity = await verifyInstitutionSsoIdToken(
      { provider: "azure-ad", idToken },
      {
        issuer,
        audience,
        jwksUri: "https://idp.example.edu/.well-known/jwks.json",
        jwksCacheTtlSeconds: 60
      }
    );

    expect(identity).toEqual({
      email: "jordan@example.edu",
      provider: "azure-ad",
      subject: "idp-user-456"
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries transient JWKS fetch failures", async () => {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const issuer = "https://idp.example.edu";
    const audience = "educlaw";
    const jwk = {
      ...publicKey.export({ format: "jwk" }),
      kid: "retry-key-1",
      use: "sig",
      alg: "RS256"
    };
    const idToken = jwt.sign(
      {
        sub: "idp-user-789",
        email: "retry@example.edu"
      },
      privateKey,
      {
        algorithm: "RS256",
        issuer,
        audience,
        expiresIn: "5m",
        keyid: "retry-key-1"
      }
    );
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new Error("temporary network failure"))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ keys: [jwk] })
      });
    vi.stubGlobal("fetch", fetchMock);

    const identity = await verifyInstitutionSsoIdToken(
      { provider: "okta", idToken },
      {
        issuer,
        audience,
        jwksUri: "https://idp.example.edu/retry-jwks.json",
        jwksCacheTtlSeconds: 60
      }
    );

    expect(identity.email).toBe("retry@example.edu");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("opens the JWKS circuit after repeated dependency failures", async () => {
    const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const issuer = "https://idp.example.edu";
    const audience = "educlaw";
    const idToken = jwt.sign(
      {
        sub: "idp-user-circuit",
        email: "circuit@example.edu"
      },
      privateKey,
      {
        algorithm: "RS256",
        issuer,
        audience,
        expiresIn: "5m",
        keyid: "circuit-key-1"
      }
    );
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false
    });
    vi.stubGlobal("fetch", fetchMock);

    const config = {
      issuer,
      audience,
      jwksUri: "https://idp.example.edu/circuit-jwks.json",
      jwksCacheTtlSeconds: 60
    };

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await expect(verifyInstitutionSsoIdToken(
        { provider: "okta", idToken },
        config
      )).rejects.toMatchObject({ code: "AUTH_PROVIDER_UNAVAILABLE" });
    }

    await expect(verifyInstitutionSsoIdToken(
      { provider: "okta", idToken },
      config
    )).rejects.toMatchObject({ code: "EXTERNAL_CIRCUIT_OPEN" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("rejects institution SSO tokens with the wrong issuer", async () => {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const idToken = jwt.sign(
      {
        sub: "idp-user-123",
        email: "maya@example.edu"
      },
      privateKey,
      {
        algorithm: "RS256",
        issuer: "https://unexpected-idp.example.edu",
        audience: "educlaw",
        expiresIn: "5m"
      }
    );

    await expect(verifyInstitutionSsoIdToken(
      { provider: "okta", idToken },
      {
        issuer: "https://idp.example.edu",
        audience: "educlaw",
        publicKey: publicKey.export({ type: "spki", format: "pem" }).toString()
      }
    )).rejects.toThrowError(HttpError);
  });
});
