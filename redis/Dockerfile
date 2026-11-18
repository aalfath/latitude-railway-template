# Redis for Latitude's BullMQ queues and cache (one durable instance; Latitude prefixes every key with "latitude:").
FROM redis:8.10.3-alpine@sha256:7958cfbb9d152f87dadfbc89f1b0b15938f0b81ff8982feb327476f4911935c3
COPY --chmod=755 start.sh /usr/local/bin/redis-start
CMD ["/usr/local/bin/redis-start"]
