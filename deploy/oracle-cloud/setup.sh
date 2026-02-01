#!/bin/bash
set -e

echo "============================================"
echo "  NestKeeper - Oracle Cloud Setup"
echo "============================================"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "Please run without sudo (script will use sudo when needed)"
    exit 1
fi

# Update system
echo "[1/6] Updating system..."
sudo apt update && sudo apt upgrade -y

# Install Docker
echo "[2/6] Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
fi

# Install netfilter-persistent for firewall rules
echo "[3/6] Configuring firewall..."
sudo apt install -y iptables-persistent netfilter-persistent

# Open ports 80 and 443 (Oracle Ubuntu has iptables rules by default)
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save

# Create app directory
echo "[4/6] Creating app directory..."
sudo mkdir -p /opt/nestkeeper
sudo chown $USER:$USER /opt/nestkeeper
cd /opt/nestkeeper

# Create docker-compose.yml
echo "[5/6] Creating configuration files..."
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  nestkeeper:
    image: ghcr.io/Leev1tan/nestkeeper:latest
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

# Create Caddyfile template
cat > Caddyfile << 'EOF'
YOUR_DOMAIN.com {
    reverse_proxy nestkeeper:3000
    encode gzip

    header {
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        Referrer-Policy strict-origin-when-cross-origin
    }
}
EOF

echo "[6/6] Setup complete!"
echo ""
echo "============================================"
echo "  Next Steps:"
echo "============================================"
echo ""
echo "1. Edit the Caddyfile with your domain:"
echo "   nano /opt/nestkeeper/Caddyfile"
echo ""
echo "2. Update docker-compose.yml with your GitHub username:"
echo "   nano /opt/nestkeeper/docker-compose.yml"
echo ""
echo "3. Point your domain's DNS A record to this IP:"
echo "   $(curl -s ifconfig.me)"
echo ""
echo "4. Log out and back in (for docker group), then deploy:"
echo "   cd /opt/nestkeeper && docker compose up -d"
echo ""
echo "============================================"
