# SeaweedFS S3 object store (upstream's bundled choice), pinned by version and digest.
FROM chrislusf/seaweedfs:4.54@sha256:4b42c212543a0acd4c0e675215ecdcaf62a186ef98def76c7e12701871222d15
COPY --chmod=755 start.sh /usr/local/bin/seaweedfs-start
ENTRYPOINT ["/usr/local/bin/seaweedfs-start"]
