# Build frontend
FROM --platform=$BUILDPLATFORM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Build backend
FROM --platform=$BUILDPLATFORM golang:1.22-alpine AS backend-builder
ARG TARGETOS
ARG TARGETARCH
WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
COPY --from=frontend-builder /app/frontend/dist ./web/dist

RUN CGO_ENABLED=0 GOOS=${TARGETOS} GOARCH=${TARGETARCH} go build -ldflags="-s -w" -o nestkeeper .

# Final image
FROM alpine:3.19
RUN apk add --no-cache ca-certificates tzdata wget

WORKDIR /app

COPY --from=backend-builder /app/nestkeeper .

# Create data directory for SQLite and uploads
RUN mkdir -p /app/data

EXPOSE 3000

ENV DATABASE_PATH=/app/data/nestkeeper.db
ENV PORT=3000

VOLUME ["/app/data"]

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget -q --spider http://localhost:3000/api/health || exit 1

CMD ["./nestkeeper"]
