# Latitude migrations (Postgres + ClickHouse), official image pinned by version and digest.
FROM latitudedata/migrations:0.3.126@sha256:8a971a9985e817834818d668ae6d54000dd0e62fbb9c21a402d0833dcdcf0438
ENV LATITUDE_VERSION=0.3.126
COPY --chmod=755 migrate.sh /usr/local/lib/latitude/migrate.sh
COPY --chmod=644 ready-server.cjs /usr/local/lib/latitude/ready-server.cjs
CMD ["/usr/local/lib/latitude/migrate.sh"]
