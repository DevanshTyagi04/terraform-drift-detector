# ==============================================================================
# STAGE 1: Frontend Build Stage
# ==============================================================================
FROM node:22-alpine AS frontend-builder
WORKDIR /src

# Copy package descriptors and install dependencies first for caching
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci || npm install

# Copy source code and build the React app
COPY frontend/ ./
RUN npm run build

# ==============================================================================
# STAGE 2: Backend Build Stage
# ==============================================================================
FROM golang:1.25-alpine AS backend-builder
WORKDIR /src

# Copy go.mod and go.sum and download modules first for caching
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the backend files and the compiled web folder from Stage 1
COPY . .
COPY --from=frontend-builder /src/../web ./web

# Compile static Go binaries (modernc.org/sqlite is pure Go, CGO is not needed)
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o bin/drift-server ./cmd/drift-server && \
    CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o bin/driftctl ./cmd/driftctl

# ==============================================================================
# STAGE 3: Final Production Runtime Stage
# ==============================================================================
FROM alpine:3.21

# OCI Image Metadata Labels
LABEL org.opencontainers.image.title="Terraform Drift Detector" \
      org.opencontainers.image.description="A custom drift detection engine for Terraform states and live AWS configurations" \
      org.opencontainers.image.source="https://github.com/DevanshTyagi04/terraform-drift-detector" \
      org.opencontainers.image.license="MIT" \
      org.opencontainers.image.version="2.0.0"

# Install runtime dependencies:
# - ca-certificates: required for AWS API HTTPS requests
# - tzdata: required for correct timezone parsing in cron schedules
# - wget: used by healthcheck
RUN apk add --no-cache ca-certificates tzdata wget

# Create a non-root system user and group for running the server securely
RUN addgroup -S driftctl && adduser -S -G driftctl driftctl

# Create persistent storage folder for SQLite database and adjust permissions
RUN mkdir -p /data && chown -R driftctl:driftctl /data

# Set working directory to app path
WORKDIR /app

# Copy compiled binaries and UI static assets
COPY --from=backend-builder --chown=driftctl:driftctl /src/bin/drift-server /app/bin/drift-server
COPY --from=backend-builder --chown=driftctl:driftctl /src/bin/driftctl /app/bin/driftctl
COPY --from=backend-builder --chown=driftctl:driftctl /src/web /app/web
COPY --from=backend-builder --chown=driftctl:driftctl /src/configs/driftctl.yaml /app/configs/driftctl.yaml

# Expose Go server's default listening port
EXPOSE 8080

# Configure persistent volumes for SQLite DB
VOLUME [ "/data" ]

# Set runtime environment variables
# DRIFTCTL_DB_PATH points the SQLite DB path to our persistent /data folder
ENV DRIFTCTL_DB_PATH=/data/driftctl.db

# Set runtime user
USER driftctl

# Define healthcheck to periodically probe the REST health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Start the drift server
ENTRYPOINT [ "/app/bin/drift-server" ]
CMD [ "-config", "/app/configs/driftctl.yaml" ]
