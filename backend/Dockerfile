# Build stage: compiles a static binary with the full Go toolchain.
FROM golang:1.27-alpine AS build
WORKDIR /src

# Copy go.mod first so the dependency layer is cached until it changes.
COPY go.mod ./
RUN go mod download

COPY . .
# CGO_ENABLED=0 produces a static binary that needs no C libraries at runtime.
# -trimpath and -ldflags="-s -w" drop local paths and debug symbols to shrink it.
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/server ./cmd/server

# Runtime stage: only the binary on a small base image, running as a non-root user.
FROM alpine:3.22
RUN adduser -D -H app
USER app

COPY --from=build /out/server /usr/local/bin/server

ENV PORT=8080
EXPOSE 8080

# busybox wget ships with alpine, so the health check needs no extra packages.
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://localhost:${PORT}/health || exit 1

ENTRYPOINT ["server"]
