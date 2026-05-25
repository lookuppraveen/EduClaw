# EduClaw Backend Observability

## Metrics

The backend exposes Prometheus text metrics at `GET /api/v1/admin/metrics`.
The route is protected by the existing admin JWT guard so scrape credentials should use an admin-scoped service account.

Available metrics:

- `educlaw_process_uptime_seconds`
- `educlaw_http_requests_total`
- `educlaw_http_request_duration_seconds`

## Dashboard

Import `grafana-dashboard.json` into Grafana and bind `${DS_PROMETHEUS}` to the Prometheus datasource scraping the backend.

## Alerts

Load `prometheus-alerts.yml` into Prometheus or Alertmanager-compatible rule provisioning.
The initial rules cover elevated 5xx rate, p95 latency above the Phase 8 target, and sustained 4xx friction.
