#!/bin/sh
# Railway start command for Latitude's Migrations service.
# Upstream runs migrations as a one-shot container that the apps wait for. Railway has no such
# ordering, and a container that exits never counts as a healthy deploy, so this service:
#   1. runs the image's own migration commands (Postgres via drizzle-kit, ClickHouse via goose),
#      retrying until Postgres and ClickHouse accept them;
#   2. waits for Temporal's frontend to listen;
#   3. stays up and answers GET /ready with the Latitude version: the gate the app services wait
#      for before they start. /health answers 200 as soon as the service is up.
set -u
export NODE_ENV="${NODE_ENV:-production}"
export LAT_CLICKHOUSE_CLUSTER_ENABLED="${LAT_CLICKHOUSE_CLUSTER_ENABLED:-false}"
export LAT_OSS_TELEMETRY_ENABLED="${LAT_OSS_TELEMETRY_ENABLED:-false}"
: "${PORT:=8080}"
STATE=/tmp/latitude-migrated
node /usr/local/lib/latitude/ready-server.cjs "$STATE" &

n=0
until pnpm --filter @platform/db-postgres pg:migrate && pnpm --filter @platform/db-clickhouse ch:up; do
  n=$((n + 1))
  if [ "$n" -ge 120 ]; then echo "migrations still failing after $n attempts; giving up so Railway restarts the service"; exit 1; fi
  echo "Postgres or ClickHouse not ready yet, or a migration failed (attempt $n), retrying in 5s"
  sleep 5
done
echo "Postgres and ClickHouse migrations for Latitude ${LATITUDE_VERSION} are applied"

if [ -n "${TEMPORAL_HOST:-}" ]; then
  until node -e 'const s=require("net").connect(7233,process.env.TEMPORAL_HOST);s.setTimeout(3000);s.on("connect",()=>process.exit(0));s.on("error",()=>process.exit(1));s.on("timeout",()=>process.exit(1))'; do
    echo "waiting for Temporal at ${TEMPORAL_HOST}:7233"
    sleep 5
  done
  sleep 10   # the server registers the default namespace a few seconds after it starts listening
fi
printf '%s' "$LATITUDE_VERSION" > "$STATE"
echo "migration gate open: app services can start"
wait
