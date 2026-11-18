# ClickHouse 26.2 (the line upstream's docker-stack.yml uses), pinned by version and digest.
FROM clickhouse/clickhouse-server:26.2.19.43@sha256:c2f2605585899d5103a0447daadbc0005f362200d5f0fcca7f40db3ca0dd36dd
# Upstream's storage policy (Latitude's tables use the "tiered" policy) and Railway settings.
COPY storage.xml /etc/clickhouse-server/config.d/storage.xml
COPY railway.xml /etc/clickhouse-server/config.d/railway.xml
