# Changelog

Every change to `main` reaches deployers as a Railway "update available" notice. Breaking changes are listed first.

## 0.3.126 (2026-11-17)

First release of this template.

- Latitude 0.3.126 (web, api, ingest, workers, workflows, migrations), pinned by digest.
- Postgres 16 with pgvector 0.8.7, ClickHouse 26.2.19.43, Redis 8.10.3, Temporal 1.32.2, SeaweedFS 4.54, all pinned by digest.
- Migration gate so the app services start only after this release's migrations.
- Sign-in emails are printed to the Workers logs until SMTP or Mailgun is configured.
- The unauthenticated `POST /v1/account/bootstrap` API route is blocked unless `LAT_ALLOW_ACCOUNT_BOOTSTRAP=true`.
