# PostgreSQL 16 with pgvector, the image upstream's docker-stack.yml uses, pinned by digest.
FROM pgvector/pgvector:0.8.7-pg16@sha256:484e838076e04939d27d3e176e91c86eea96236126023be8d3059761122e579f
# Creates Latitude's restricted runtime role (subject to row-level security) on first start,
# replacing upstream's bind-mounted docker/init-db.sh.
COPY --chmod=755 init-db.sh /docker-entrypoint-initdb.d/10-latitude-runtime-user.sh
ENV PGDATA=/var/lib/postgresql/data/pgdata
# wal_level=logical as upstream; listen on IPv4 and IPv6 (Railway's private network).
CMD ["postgres", "-c", "wal_level=logical", "-c", "listen_addresses=*", "-c", "max_connections=200"]
