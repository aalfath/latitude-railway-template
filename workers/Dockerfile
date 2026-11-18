# Latitude BullMQ background workers (workers), official image pinned by version and digest.
# Keep every latitudedata/* pin in this repo on the same version.
FROM latitudedata/workers:0.3.126@sha256:6d960588b8ae794131857f555bb0c9ab8c3aa53988f76378f5fdcab21ebdd340
ENV LATITUDE_VERSION=0.3.126
COPY --chmod=755 start.sh /usr/local/lib/latitude/start.sh
COPY --chmod=644 gate.cjs /usr/local/lib/latitude/gate.cjs
COPY --chmod=644 log-mailer.cjs /usr/local/lib/latitude/log-mailer.cjs
ENTRYPOINT ["/usr/local/lib/latitude/start.sh"]
# The image's own command, unchanged.
CMD ["node", "--enable-source-maps", "apps/workers/dist/server.cjs"]
