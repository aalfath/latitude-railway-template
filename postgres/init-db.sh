#!/bin/bash
# Upstream docker/init-db.sh (latitude-llm v0.3.126), with the password quoted safely.
# Runs once, on an empty data directory, before Latitude's migrations grant this role its rights.
set -e
: "${POSTGRES_RUNTIME_USER:=latitude_app}"
: "${POSTGRES_RUNTIME_PASSWORD:?POSTGRES_RUNTIME_PASSWORD is required}"
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -v ru="$POSTGRES_RUNTIME_USER" -v rp="$POSTGRES_RUNTIME_PASSWORD" -v db="$POSTGRES_DB" <<-'EOSQL'
    CREATE USER :"ru" WITH PASSWORD :'rp';
    GRANT CONNECT ON DATABASE :"db" TO :"ru";
EOSQL
