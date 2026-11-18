#!/bin/sh
# Redis for Latitude's BullMQ queues and cache, with upstream's durable queue settings
# (appendonly + noeviction) and data on the /data volume.
# No password: Latitude's cache client (LAT_REDIS_*) has no password setting in 0.3.126, so
# Redis is reachable only on the project's private network (no public domain, no TCP proxy),
# as in upstream's own stack. It listens on IPv4 and IPv6 (Railway's private network is IPv6).
set -eu
exec docker-entrypoint.sh redis-server --appendonly yes --maxmemory-policy noeviction --dir /data \
  --protected-mode no --bind "* -::*" --port "${REDIS_PORT:-6379}"
