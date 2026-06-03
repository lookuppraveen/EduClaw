# EduClaw Backend Deployment Runbook

## Purpose

Use this runbook to deploy the EduClaw backend with production-ready configuration,
database migrations, health checks, observability, and rollback steps.

## Required Configuration

Set these environment variables before starting the service:

- `NODE_ENV=production`
- `PORT`
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `DATA_ENCRYPTION_KEY`
- `TENANT_ID`
- `CORS_ORIGINS`
- `SSO_ISSUER`
- `SSO_AUDIENCE`
- `SSO_PUBLIC_KEY` or `SSO_JWKS_URI`
- `SSO_JWKS_CACHE_TTL_SECONDS`
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX_REQUESTS`
- `IDEMPOTENCY_TTL_MS`
- `LOG_LEVEL`

Do not set `AUTH_ALLOW_MOCK_SSO=true` in production. Mock SSO is ignored in
production, but leaving it unset keeps deployment intent clear.

## Pre-Deployment Checks

1. Confirm CI passed for the commit being deployed.
2. Confirm the SBOM artifact and production dependency audit completed.
3. Confirm `DATABASE_URL` points to the target production database.
4. Confirm `DATA_ENCRYPTION_KEY` is stable and stored in the secrets manager.
5. Confirm `CORS_ORIGINS` contains only approved frontend origins.
6. Confirm institution SSO configuration is complete.
7. Confirm Prometheus can scrape `GET /api/v1/admin/metrics` with an admin-scoped service account.

## Migration Procedure

1. Take or verify a recent database backup.
2. Run pending Prisma migrations before routing traffic to the new version.
3. Verify migration success against the target database.
4. Start the new backend version.
5. Confirm `GET /api/v1/health` returns `200`.
6. Confirm `GET /api/v1/ready` returns `200` and reports the database check as `ok`.

## Traffic Cutover

1. Register the new instance with the load balancer only after readiness passes.
2. Keep old instances serving traffic until new instances are healthy.
3. Drain old instances by removing them from the load balancer.
4. Allow graceful shutdown to complete on old instances before termination.

## Post-Deployment Verification

Verify these user journeys in production or staging:

- Login through institution SSO.
- Refresh and logout session flow.
- Student course list and learner state read.
- Student conversation creation and turn submission.
- Faculty policy publish and flagged review read.
- Consent update and consent history read.
- Admin KPI and audit log read.
- Auditor FERPA scope read.

Review these operational signals:

- 5xx rate is below alert threshold.
- P95 latency is below the configured SLA threshold.
- 4xx rate is not unexpectedly elevated.
- Readiness probes are stable.
- No sustained database connection errors appear in logs.

## Rollback Procedure

1. Stop routing new traffic to the failing version.
2. Route traffic back to the last known-good version.
3. Confirm health and readiness on the restored version.
4. Review whether the failed release included irreversible migrations.
5. If data rollback is required, restore from backup or apply an approved corrective migration.
6. Preserve logs, metrics, and audit records for incident review.

## Incident Notes

For suspected security incidents:

- Preserve audit logs and application logs.
- Do not rotate encryption keys until affected data and blast radius are understood.
- Rotate JWT and SSO-related secrets if token compromise is suspected.
- Review audit hash-chain integrity before relying on audit records for investigation.
- Run the external penetration-test follow-up once the environment is stabilized.
