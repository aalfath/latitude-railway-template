# Latitude OTLP trace ingest (ingest), official image pinned by version and digest.
# Keep every latitudedata/* pin in this repo on the same version.
FROM latitudedata/ingest:0.3.126@sha256:f74a2d8033e38ac5173d2d0e27c044ca3e801a9caaaf845944fc65946ca20dd3
ENV LATITUDE_VERSION=0.3.126
COPY --chmod=755 start.sh /usr/local/lib/latitude/start.sh
COPY --chmod=644 gate.cjs /usr/local/lib/latitude/gate.cjs
ENTRYPOINT ["/usr/local/lib/latitude/start.sh"]
# The image's own command, unchanged.
CMD ["node", "--enable-source-maps", "apps/ingest/dist/server.cjs"]
