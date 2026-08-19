# ==========================================
# Build Stage
# ==========================================
FROM golang:1.23-alpine AS builder

WORKDIR /app

# Install git and ca-certificates
RUN apk add --no-cache git ca-certificates

# Cache dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source files
COPY . .

# Build statically compiled binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-w -s" \
    -o /app/server .

# ==========================================
# Final Production Stage
# ==========================================
FROM alpine:3.20

WORKDIR /app

# Install ca-certificates and tzdata for TLS/SSL and timezone support
RUN apk --no-cache add ca-certificates tzdata

# Create non-root system user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy compiled binary from builder
COPY --from=builder /app/server /app/server

# Change ownership to non-root user
USER appuser:appgroup

# Service port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

ENTRYPOINT ["/app/server"]
