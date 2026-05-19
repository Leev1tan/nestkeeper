#!/bin/bash
set -e

echo "============================================"
echo "  NestKeeper - Proxmox LXC Setup"
echo "  (Cloudflare Tunnel + Access)"
echo "============================================"
echo ""

if [ -f /proc/1/environ ] && grep -q container=lxc /proc/1/environ 2>/dev/null; then
    echo "Detected: Running inside LXC container"
elif [ -f /.dockerenv ]; then
    echo "Warning: Running inside Docker (expected LXC)"
else
    echo "Note: LXC not detected - proceeding anyway"
fi
echo ""

if [ "$EUID" -ne 0 ]; then
    echo "Please run as root: bash setup.sh"
    exit 1
fi

echo "--------------------------------------------"
echo "  Cloudflare Tunnel token"
echo "--------------------------------------------"
echo ""
echo "Before running this you must have already done, in the Cloudflare Zero Trust dashboard:"
echo "  1. Created a named tunnel called 'nestkeeper'"
echo "  2. Added a public hostname: nestkeeper.pp.ua -> http://nestkeeper:3000"
echo "  3. Created an Access application for nestkeeper.pp.ua with Google IdP and"
echo "     allowlisted emails: admin@pbxes.com.ua, vshabat64@gmail.com"
echo ""
echo "See deploy/proxmox/SETUP.md for the step-by-step walkthrough."
echo ""
read -s -p "Paste the Cloudflare Tunnel token: " CF_TUNNEL_TOKEN
echo ""

if [ -z "$CF_TUNNEL_TOKEN" ]; then
    echo "Error: tunnel token cannot be empty"
    exit 1
fi

echo "[1/5] Updating system..."
apt update && apt upgrade -y

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

echo "[3/5] Verifying Docker..."
if ! docker info &> /dev/null; then
    echo "Error: Docker is not running."
    echo "If you're in an LXC container, make sure 'nesting' is enabled:"
    echo "  Proxmox UI > Container > Options > Features > check 'nesting'"
    echo "Then restart the container and run this script again."
    exit 1
fi
echo "Docker is running"

echo "[4/5] Writing config to /opt/nestkeeper..."
mkdir -p /opt/nestkeeper
cd /opt/nestkeeper

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

  cloudflared:
    image: cloudflare/cloudflared:2024.10.0
    restart: unless-stopped
    command: tunnel --no-autoupdate run --token ${CF_TUNNEL_TOKEN}
    env_file:
      - .env
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
COMPOSE

umask 077
cat > .env << ENV
CF_TUNNEL_TOKEN=${CF_TUNNEL_TOKEN}
ENV
umask 022

echo "[5/5] Starting NestKeeper..."
docker compose pull
docker compose up -d

echo ""
echo "Waiting for NestKeeper to become healthy..."
sleep 15

if docker compose ps | grep -q "healthy"; then
    STATUS="healthy"
else
    STATUS="starting (may take a moment; check 'docker compose logs')"
fi

echo ""
echo "============================================"
echo "  Setup Complete!"
echo "============================================"
echo ""
echo "  Public URL: https://nestkeeper.pp.ua"
echo "  Status:     ${STATUS}"
echo "  App dir:    /opt/nestkeeper"
echo ""
echo "  Useful commands:"
echo "    docker compose ps                  # Check status"
echo "    docker compose logs -f cloudflared # Tunnel logs"
echo "    docker compose logs -f nestkeeper  # App logs"
echo "    docker compose pull                # Update images"
echo "    docker compose up -d               # Restart after update"
echo ""
echo "  First request to https://nestkeeper.pp.ua should redirect to"
echo "  a Cloudflare Google login. Only allowlisted emails will pass."
echo ""
echo "============================================"
