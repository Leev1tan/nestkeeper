#!/bin/bash
set -e

echo "============================================"
echo "  NestKeeper - Proxmox LXC Setup"
echo "============================================"
echo ""

# Detect if running in LXC
if [ -f /proc/1/environ ] && grep -q container=lxc /proc/1/environ 2>/dev/null; then
    echo "Detected: Running inside LXC container"
elif [ -f /.dockerenv ]; then
    echo "Warning: Running inside Docker (expected LXC)"
else
    echo "Note: LXC not detected - proceeding anyway"
fi
echo ""

# Must run as root in LXC (no sudo needed)
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root: bash setup.sh"
    exit 1
fi

# Ask for DuckDNS subdomain
echo "--------------------------------------------"
echo "  DuckDNS Configuration"
echo "--------------------------------------------"
echo ""
echo "Go to https://www.duckdns.org and claim a subdomain."
echo "Example: if you claimed 'nestkeeper', your domain is nestkeeper.duckdns.org"
echo ""
read -p "Enter your DuckDNS subdomain (without .duckdns.org): " DUCK_SUBDOMAIN

if [ -z "$DUCK_SUBDOMAIN" ]; then
    echo "Error: Subdomain cannot be empty"
    exit 1
fi

DOMAIN="${DUCK_SUBDOMAIN}.duckdns.org"
echo ""
echo "Domain will be: ${DOMAIN}"
echo ""

# Update system
echo "[1/5] Updating system..."
apt update && apt upgrade -y

# Install Docker
echo "[2/5] Installing Docker..."
if ! command -v docker &> /dev/null; then
    apt install -y ca-certificates curl gnupg
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    echo "Docker installed successfully"
else
    echo "Docker already installed"
fi

# Verify Docker works
echo "[3/5] Verifying Docker..."
if ! docker info &> /dev/null; then
    echo "Error: Docker is not running."
    echo "If you're in an LXC container, make sure 'nesting' is enabled:"
    echo "  Proxmox UI > Container > Options > Features > check 'nesting'"
    echo "Then restart the container and run this script again."
    exit 1
fi
echo "Docker is running"

# Create app directory
echo "[4/5] Creating app directory..."
mkdir -p /opt/nestkeeper
cd /opt/nestkeeper

# Create docker-compose.yml
cat > docker-compose.yml << 'COMPOSE'
services:
  nestkeeper:
    image: ghcr.io/leev1tan/nestkeeper:latest
    restart: unless-stopped
    volumes:
      - nestkeeper-data:/app/data
    environment:
      - DATABASE_PATH=/app/data/nestkeeper.db
      - UPLOAD_PATH=/app/data/documents
      - BACKUP_PATH=/app/data/backups
      - PORT=3000
      - ENVIRONMENT=production
    networks:
      - web
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 15s

  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy-data:/data
      - caddy-config:/config
    networks:
      - web
    depends_on:
      nestkeeper:
        condition: service_healthy

networks:
  web:
    driver: bridge

volumes:
  nestkeeper-data:
  caddy-data:
  caddy-config:
COMPOSE

# Create Caddyfile with user's domain
cat > Caddyfile << CADDY
${DOMAIN} {
    reverse_proxy nestkeeper:3000
    encode gzip

    header {
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        Referrer-Policy strict-origin-when-cross-origin
    }
}
CADDY

echo "[5/5] Starting NestKeeper..."
docker compose pull
docker compose up -d

# Wait for health check
echo ""
echo "Waiting for NestKeeper to start..."
sleep 10

if docker compose ps | grep -q "healthy"; then
    STATUS="healthy"
else
    STATUS="starting (may take a moment)"
fi

echo ""
echo "============================================"
echo "  Setup Complete!"
echo "============================================"
echo ""
echo "  Domain:  https://${DOMAIN}"
echo "  Status:  ${STATUS}"
echo "  App dir: /opt/nestkeeper"
echo ""
echo "  Useful commands:"
echo "    docker compose ps          # Check status"
echo "    docker compose logs -f     # View logs"
echo "    docker compose pull        # Update to latest"
echo "    docker compose up -d       # Restart after update"
echo ""
echo "  Make sure your DuckDNS subdomain '${DUCK_SUBDOMAIN}'"
echo "  points to this server's IP: $(curl -s ifconfig.me 2>/dev/null || echo 'unknown')"
echo ""
echo "============================================"
