# Latitude Temporal workflow workers (workflows), official image pinned by version and digest.
# Keep every latitudedata/* pin in this repo on the same version.
FROM latitudedata/workflows:0.3.126@sha256:0988222b4ed1c09839e56a7f22b43648872fc2092abbc83091a46206f03f183f
ENV LATITUDE_VERSION=0.3.126
COPY --chmod=755 start.sh /usr/local/lib/latitude/start.sh
COPY --chmod=644 gate.cjs /usr/local/lib/latitude/gate.cjs
ENTRYPOINT ["/usr/local/lib/latitude/start.sh"]
# The image's own command, unchanged.
CMD ["node", "--enable-source-maps", "apps/workflows/dist/server.cjs"]
