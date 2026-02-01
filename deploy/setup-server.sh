#!/bin/bash
set -e

# NestKeeper VPS Setup Script
# Run this on a fresh Ubuntu 22.04+ VPS

echo "=== NestKeeper Server Setup ==="

# Update system
echo "Updating system..."
apt update && apt upgrade -y

# Install Docker
echo "Installing Docker..."
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# Install Docker Compose
echo "Installing Docker Compose..."
apt install -y docker-compose-plugin

# Create app directory
echo "Creating app directory..."
mkdir -p /opt/nestkeeper
cd /opt/nestkeeper

# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  nestkeeper:
    image: ghcr.io/YOUR_USERNAME/nestkeeper:latest
    restart: unless-stopped
    volumes:
      - nestkeeper-data:/app/data
    environment:
      - DATABASE_PATH=/app/data/nestkeeper.db
      - PORT=3000
    networks:
      - web

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
      - nestkeeper

networks:
  web:

volumes:
  nestkeeper-data:
  caddy-data:
  caddy-config:
EOF

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Edit /opt/nestkeeper/Caddyfile and replace YOUR_DOMAIN.com with your domain"
echo "2. Point your domain's DNS A record to this server's IP"
echo "3. Run: cd /opt/nestkeeper && docker compose up -d"
echo ""
echo "Your server IP: $(curl -s ifconfig.me)"
