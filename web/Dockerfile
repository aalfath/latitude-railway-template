# Latitude web UI (web), official image pinned by version and digest.
# Keep every latitudedata/* pin in this repo on the same version.
FROM latitudedata/web:0.3.126@sha256:e664b19c12f7dfdf1678311b4d9d6e046432d53b607302a3787cb4edcb044838
ENV LATITUDE_VERSION=0.3.126
COPY --chmod=755 start.sh /usr/local/lib/latitude/start.sh
COPY --chmod=644 gate.cjs /usr/local/lib/latitude/gate.cjs
ENTRYPOINT ["/usr/local/lib/latitude/start.sh"]
# The image's own command, unchanged.
CMD ["node", "--enable-source-maps", "--no-experimental-webstorage", "apps/web/.output/server/index.mjs"]
