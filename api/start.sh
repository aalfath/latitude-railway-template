#!/bin/sh
# Railway start wrapper for the Latitude app services (web, api, ingest, workers, workflows):
# fills in the settings this single-instance stack fixes, waits until this release's database
# migrations are applied (gate.cjs), then execs the image's own command.
# Every value below can still be overridden with a service variable of the same name.
set -eu
L=/usr/local/lib/latitude

export NODE_ENV="${NODE_ENV:-production}"
export LAT_OSS_TELEMETRY_ENABLED="${LAT_OSS_TELEMETRY_ENABLED:-false}"
export LAT_REDIS_PORT="${LAT_REDIS_PORT:-6379}"
export LAT_BULLMQ_HOST="${LAT_BULLMQ_HOST:-${LAT_REDIS_HOST:-}}"
export LAT_BULLMQ_PORT="${LAT_BULLMQ_PORT:-$LAT_REDIS_PORT}"
export LAT_CLICKHOUSE_CLUSTER_ENABLED="${LAT_CLICKHOUSE_CLUSTER_ENABLED:-false}"
export LAT_TEMPORAL_NAMESPACE="${LAT_TEMPORAL_NAMESPACE:-default}"
export LAT_TEMPORAL_TASK_QUEUE="${LAT_TEMPORAL_TASK_QUEUE:-latitude-workflows}"
export LAT_STORAGE_DRIVER="${LAT_STORAGE_DRIVER:-s3}"
export LAT_STORAGE_S3_REGION="${LAT_STORAGE_S3_REGION:-us-east-1}"
export LAT_STORAGE_S3_FORCE_PATH_STYLE="${LAT_STORAGE_S3_FORCE_PATH_STYLE:-true}"
export LAT_PG_POOL_MAX="${LAT_PG_POOL_MAX:-10}"

# Every service listens on Railway's PORT, which the health check and the domain use.
if [ -n "${PORT:-}" ]; then
  export LAT_WEB_PORT="${LAT_WEB_PORT:-$PORT}" LAT_API_PORT="${LAT_API_PORT:-$PORT}"
  export LAT_INGEST_PORT="${LAT_INGEST_PORT:-$PORT}" LAT_WORKERS_HEALTH_PORT="${LAT_WORKERS_HEALTH_PORT:-$PORT}"
  export LAT_WORKFLOWS_HEALTH_PORT="${LAT_WORKFLOWS_HEALTH_PORT:-$PORT}"
fi

# Browser origins default to the web URL.
if [ -n "${LAT_WEB_URL:-}" ]; then
  export LAT_TRUSTED_ORIGINS="${LAT_TRUSTED_ORIGINS:-$LAT_WEB_URL}"
  export LAT_CORS_ALLOWED_ORIGINS="${LAT_CORS_ALLOWED_ORIGINS:-$LAT_WEB_URL}"
fi

# Workers only (the image that sends email): with no SMTP or Mailgun configured, a local mail
# catcher prints every email, sign-in links included, to the Workers deploy logs, so the first
# login needs no mail provider. Setting LAT_SMTP_HOST/USER/PASS (+ LAT_SMTP_FROM) or
# LAT_MAILGUN_API_KEY/DOMAIN on the Workers service switches to real email.
if [ -f "$L/log-mailer.cjs" ]; then
  if [ -n "${LAT_MAILGUN_API_KEY:-}" ] && [ -n "${LAT_MAILGUN_DOMAIN:-}" ]; then
    echo "email: sending through Mailgun"
  elif [ -n "${LAT_SMTP_HOST:-}" ] && [ -n "${LAT_SMTP_USER:-}" ] && [ -n "${LAT_SMTP_PASS:-}" ]; then
    echo "email: sending through SMTP ($LAT_SMTP_HOST)"
  else
    export LAT_MAILPIT_HOST=127.0.0.1 LAT_MAILPIT_PORT="${LOG_MAILER_PORT:-2525}"
    export LAT_MAILPIT_FROM="${LAT_MAILPIT_FROM:-noreply@latitude.local}"
    ( while :; do node "$L/log-mailer.cjs" || true; sleep 2; done ) &
    echo "email: no SMTP or Mailgun configured; emails (sign-in links included) are printed in these logs"
  fi
fi

node "$L/gate.cjs"
exec "$@"
