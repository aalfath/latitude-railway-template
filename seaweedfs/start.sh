#!/bin/sh
# Upstream docker/seaweedfs/init.sh (create the bucket once the S3 gateway is up), plus an S3
# identity so the S3 API needs credentials (upstream's bundled SeaweedFS accepts anonymous
# requests). Data lives on the /data volume.
set -eu
: "${S3_ACCESS_KEY:?S3_ACCESS_KEY is required}"
: "${S3_SECRET_KEY:?S3_SECRET_KEY is required}"
BUCKET="${S3_BUCKET:-latitude}"
mkdir -p /etc/seaweedfs /data
cat > /etc/seaweedfs/s3.json <<JSON
{"identities":[{"name":"latitude","credentials":[{"accessKey":"${S3_ACCESS_KEY}","secretKey":"${S3_SECRET_KEY}"}],"actions":["Admin","Read","Write","List","Tagging"]}]}
JSON
(
  until echo "s3.bucket.list" | weed shell >/dev/null 2>&1; do sleep 2; done
  if echo "s3.bucket.list" | weed shell 2>/dev/null | awk '{print $1}' | grep -qx "$BUCKET"; then
    echo "bucket $BUCKET already exists"
  else
    echo "s3.bucket.create -name $BUCKET" | weed shell && echo "bucket $BUCKET created"
  fi
) &
# All SeaweedFS parts run in this one container and talk over loopback; the S3 port listens on
# every address (IPv6 for Railway's private network; set SEAWEED_BIND=0.0.0.0 on IPv4-only Docker).
exec weed server -dir=/data -ip=127.0.0.1 -ip.bind="${SEAWEED_BIND:-::}" -volume.max=0 \
  -master.volumeSizeLimitMB=1024 -s3 -s3.port=8333 -s3.config=/etc/seaweedfs/s3.json
