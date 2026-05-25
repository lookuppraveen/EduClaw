# EduClaw Backend Security Review

## Scope

This review covers the current modular Express API surface, authentication/session flow, role and consent enforcement, request hardening, and observability exposure.

## Remediated Findings

- Invalid refresh and logout tokens now return a controlled `401 AUTH_REFRESH_INVALID` response instead of falling through as generic server errors.
- Baseline API security headers are applied globally, including `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and `Cross-Origin-Resource-Policy`.
- Express framework disclosure is disabled with `x-powered-by` suppression.
- Admin metrics remain behind the existing admin role guard.

## Existing Controls Observed

- Access and refresh tokens use separate secrets and refresh sessions store token hashes rather than plaintext tokens.
- Refresh tokens rotate on refresh and revoked sessions are rejected.
- Sensitive writes use idempotency keys where mounted.
- RBAC and learner-data ABAC checks are covered by integration tests.
- Consent changes, policy changes, review decisions, and admin integration updates emit audit records.
- Rate limiting is enabled globally.

## Remaining Security Work

- Replace mock SSO login exchange with real institution IdP verification before production.
- Move in-memory rate limit, idempotency, and metrics state to shared infrastructure for multi-instance deployments.
- Add dependency/SBOM scanning and automated vulnerability gates in CI.
- Run an external penetration test against a deployed environment with production-like TLS, proxy, and IdP configuration.
