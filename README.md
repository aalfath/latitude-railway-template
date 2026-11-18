[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/new/template/latitude-2?utm_medium=integration&utm_source=button&utm_campaign=latitude)

# Latitude on Railway

A Railway template for [Latitude](https://github.com/latitude-dev/latitude-llm), the open-source (MIT) observability platform for AI agents: send OpenTelemetry traces from your agents, find where they fail, run evaluations and query everything through the API or the MCP server.

**Version:** Latitude **0.3.126** (released 2026-11-03), from the official `latitudedata/*` images, pinned by version and digest.

## What it deploys

Every service builds from a folder of this repo (`FROM image:version@sha256:…` plus a small wrapper), following upstream's [single-host stack](https://docs.latitude.so/deployment/single-host).

| Service | Folder | Image | Public | Volume |
|---|---|---|---|---|
| Web (UI) | `web/` | `latitudedata/web:0.3.126` | yes | |
| API (REST + MCP) | `api/` | `latitudedata/api:0.3.126` | yes | |
| Ingest (OTLP) | `ingest/` | `latitudedata/ingest:0.3.126` | yes | |
| Workers (queues, email) | `workers/` | `latitudedata/workers:0.3.126` | | |
| Workflows (Temporal workers) | `workflows/` | `latitudedata/workflows:0.3.126` | | |
| Migrations (gate) | `migrations/` | `latitudedata/migrations:0.3.126` | | |
| Postgres + pgvector | `postgres/` | `pgvector/pgvector:0.8.7-pg16` | | `/var/lib/postgresql/data` |
| ClickHouse | `clickhouse/` | `clickhouse/clickhouse-server:26.2.19.43` | | `/var/lib/clickhouse` |
| Redis (queues + cache) | `redis/` | `redis:8.10.3-alpine` | | `/data` |
| Temporal | `temporal/` | `temporalio/server:1.32.2` | | (stored in Postgres) |
| SeaweedFS (S3) | `seaweedfs/` | `chrislusf/seaweedfs:4.54` | | `/data` |

What the wrappers add:

- **Start order.** Railway has no `depends_on`. The Migrations service runs the image's own Postgres and ClickHouse migrations, waits for Temporal, then answers `/ready` with the version. Each app service waits for that (`gate.cjs`) before it starts, and answers its health check meanwhile.
- **Login without an email provider.** Latitude signs in only by emailed magic link. Until you configure SMTP or Mailgun, a tiny mail catcher in the Workers service prints every email (with its links) to the **Workers deploy logs**, which only members of your Railway project can read.
- **Closed anonymous sign-up on the API.** Upstream's `POST /v1/account/bootstrap` creates an organization and API key with no authentication. The API service refuses it unless you set `LAT_ALLOW_ACCOUNT_BOOTSTRAP=true`.
- Postgres creates Latitude's restricted runtime role on first start, ClickHouse gets upstream's storage policy, Redis runs with AOF and `noeviction` and has no public domain (Latitude's cache client can't send a Redis password, so Redis is reachable only on the project's private network), SeaweedFS requires S3 credentials and creates the bucket, Temporal creates and migrates its own databases.

## Variables

There are no prompts. Passwords and keys are generated per deployment with `${{secret()}}`, and services find each other through Railway reference variables on the private network.

| Variable | Service(s) | Default |
|---|---|---|
| `LAT_MASTER_ENCRYPTION_KEY`, `LAT_BETTER_AUTH_SECRET`, `LAT_REDACTION_PSEUDONYM_SECRET` | Web (shared by reference) | 64 hex characters, generated |
| `POSTGRES_PASSWORD`, `POSTGRES_RUNTIME_PASSWORD` | Postgres | generated |
| `CLICKHOUSE_PASSWORD` | ClickHouse | generated |
| `S3_ACCESS_KEY`, `S3_SECRET_KEY` | SeaweedFS | generated |
| `LAT_WEB_URL`, `LAT_API_URL`, `LAT_INGEST_URL` | app services | `https://` + the Railway domains |

Optional settings go on the service that uses them (see upstream's [configuration reference](https://docs.latitude.so/deployment/configuration)):

- **Email:** on **Workers**, set `LAT_SMTP_HOST`, `LAT_SMTP_PORT`, `LAT_SMTP_USER`, `LAT_SMTP_PASS`, `LAT_SMTP_FROM` (or `LAT_MAILGUN_API_KEY`, `LAT_MAILGUN_DOMAIN`, `LAT_MAILGUN_FROM`). The log catcher switches off by itself.
- **Restrict sign-up:** on **Web**, `LAT_ALLOWED_EMAIL_DOMAIN=your-company.com`.
- **AI features** (evaluations, semantic search): provider keys such as `LAT_OPENAI_API_KEY` or `LAT_VOYAGE_API_KEY` plus `LAT_AI_*` model settings, on Web, API, Workers and Workflows. Pick the embedding model once; it can't be changed later.

## After deploying

1. Wait until all services are green (the first boot takes a few minutes while migrations run).
2. Open the **Web** domain and enter your email.
3. Open the **Workers** service, then Deployments, then View logs, and look for `===== EMAIL`. Open the `Link:` it shows to finish signing in.
4. Create your organization and project, then an API key, and point your OpenTelemetry exporter or the Latitude SDK at the **Ingest** domain (traces) and the **API** domain (API and MCP at `/v1/mcp`).

## Updates

Railway tells everyone who deployed this template when `main` of this repo changes. Each change is listed in [CHANGELOG.md](CHANGELOG.md), breaking changes first. When you apply an update, the Migrations service applies the new release's migrations, and the app services wait until it has. Back up the Postgres and ClickHouse volumes before a large upgrade.

Maintainers: bump all six `latitudedata/*` pins together (same version, new digests), and keep `LATITUDE_VERSION` in each Dockerfile equal to it.

## Licence

This wrapper is MIT-licensed. Latitude is MIT-licensed by Latitude Data S.L.
