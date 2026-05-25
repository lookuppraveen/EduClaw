import { describe, expect, it } from "vitest";
import { env, isMockSsoAllowed } from "../src/config/env.js";

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
});
