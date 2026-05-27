# EduClaw Backend Security Review

## Scope

This review covers the current modular Express API surface, authentication/session flow, role and consent enforcement, request hardening, and observability exposure.

## Remediated Findings

- Invalid refresh and logout tokens now return a controlled `401 AUTH_REFRESH_INVALID` response instead of falling through as generic server errors.
- `/auth/login` supports institution SSO token verification with configured issuer, audience, and public key; explicit-email mock SSO remains gated to non-production environments.
- Baseline API security headers are applied globally, including `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and `Cross-Origin-Resource-Policy`.
- Express framework disclosure is disabled with `x-powered-by` suppression.
- Admin metrics remain behind the existing admin role guard.

## Existing Controls Observed

- Access and refresh tokens use separate secrets and refresh sessions store token hashes rather than plaintext tokens.
- Refresh tokens rotate on refresh and revoked sessions are rejected.
- Sensitive writes use idempotency keys where mounted.
- Idempotency records for sensitive writes are persisted in PostgreSQL so retries can replay consistently across API instances.
- RBAC and learner-data ABAC checks are covered by integration tests.
- Consent changes, policy changes, review decisions, and admin integration updates emit audit records.
- Rate limiting is enabled globally.
- Rate limit buckets are persisted in PostgreSQL so throttling decisions are shared across API instances.
- HTTP request metric aggregates are persisted in PostgreSQL so the admin metrics endpoint can report across API instances.
- Backend CI gates dependency risk with `npm audit --omit=dev --audit-level=high` and uploads a CycloneDX SBOM artifact generated from the package lock.

## Remaining Security Work

- Replace static IdP public key configuration with JWKS discovery and key rotation before production.
- Run an external penetration test against a deployed environment with production-like TLS, proxy, and IdP configuration.
