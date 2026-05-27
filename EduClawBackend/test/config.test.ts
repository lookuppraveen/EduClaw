import { describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import { generateKeyPairSync } from "node:crypto";
import { env, isInstitutionSsoConfigured, isMockSsoAllowed } from "../src/config/env.js";
import { HttpError } from "../src/common/errors.js";
import { verifyInstitutionSsoIdToken } from "../src/modules/auth/sso.service.js";

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
    expect(isInstitutionSsoConfigured("https://idp.example.edu", "educlaw", undefined)).toBe(false);
  });

  it("verifies institution SSO tokens with issuer, audience, and public key", () => {
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

    const identity = verifyInstitutionSsoIdToken(
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

  it("rejects institution SSO tokens with the wrong issuer", () => {
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

    expect(() => verifyInstitutionSsoIdToken(
      { provider: "okta", idToken },
      {
        issuer: "https://idp.example.edu",
        audience: "educlaw",
        publicKey: publicKey.export({ type: "spki", format: "pem" }).toString()
      }
    )).toThrowError(HttpError);
  });
});
