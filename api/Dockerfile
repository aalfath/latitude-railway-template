# Latitude public API and MCP server (api), official image pinned by version and digest.
# Keep every latitudedata/* pin in this repo on the same version.
FROM latitudedata/api:0.3.126@sha256:3acef21701f4101bc1ba8021b750d099489c156dbb5e0b0313b080a6def74e79
ENV LATITUDE_VERSION=0.3.126 \
    LAT_API_PORT=3001
COPY --chmod=755 start.sh /usr/local/lib/latitude/start.sh
COPY --chmod=644 gate.cjs /usr/local/lib/latitude/gate.cjs
COPY --chmod=644 api-guard.cjs /usr/local/lib/latitude/api-guard.cjs
ENTRYPOINT ["/usr/local/lib/latitude/start.sh"]
# The image's own command, behind the guard (listens on PORT, API on 127.0.0.1:3001).
CMD ["node", "/usr/local/lib/latitude/api-guard.cjs", "node", "--enable-source-maps", "apps/api/dist/server.cjs"]
