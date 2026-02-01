# NestKeeper Deployment Guide

## Quick Start (Manual Deployment)

### 1. Get a Server

**FREE Option (Recommended):**
- **Oracle Cloud Always Free** - $0/mo forever!
  - 4 ARM cores, 24GB RAM, 200GB storage
  - See `deploy/oracle-cloud/SETUP.md` for detailed guide

**Paid Options:**
- **Hetzner Cloud** - €3.79/mo (CX11: 1 vCPU, 2GB RAM) - Best value
- **DigitalOcean** - $6/mo (Basic: 1 vCPU, 1GB RAM)
- **Vultr** - $5/mo (Cloud Compute: 1 vCPU, 1GB RAM)

Choose **Ubuntu 22.04 LTS** as the OS.

### 2. Get a Domain

- **Namecheap** - ~$10/year for .com
- **Cloudflare Registrar** - At-cost pricing
- **Porkbun** - Often cheapest

### 3. Setup DNS

Point your domain to your VPS:
1. Go to your domain registrar's DNS settings
2. Add an **A record**:
   - Name: `@` (or your subdomain like `app`)
   - Value: Your VPS IP address
   - TTL: 300 (or Auto)

### 4. Setup Server

SSH into your VPS:
```bash
ssh root@YOUR_VPS_IP
```

Run the setup script:
```bash
curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/nestkeeper/main/deploy/setup-server.sh | bash
```

Or manually:
```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Create app directory
mkdir -p /opt/nestkeeper
cd /opt/nestkeeper
```

### 5. Configure

Create the Caddyfile:
```bash
cat > /opt/nestkeeper/Caddyfile << 'EOF'
yourdomain.com {
    reverse_proxy nestkeeper:3000
    encode gzip
}
EOF
```

Create docker-compose.yml:
```bash
cat > /opt/nestkeeper/docker-compose.yml << 'EOF'
version: '3.8'

services:
  nestkeeper:
    image: ghcr.io/YOUR_USERNAME/nestkeeper:latest
    restart: unless-stopped
    volumes:
      - nestkeeper-data:/app/data
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
    networks:
      - web

networks:
  web:

volumes:
  nestkeeper-data:
  caddy-data:
EOF
```

### 6. Deploy

```bash
cd /opt/nestkeeper
docker compose up -d
```

Your app will be live at `https://yourdomain.com` with automatic HTTPS!

---

## Automated Deployment (GitHub Actions)

### Setup

1. Push your code to GitHub

2. Add these secrets to your repo (Settings → Secrets → Actions):
   - `VPS_HOST` - Your VPS IP address
   - `VPS_USER` - SSH username (usually `root`)
   - `VPS_SSH_KEY` - Your private SSH key

3. Generate SSH key for deployment:
   ```bash
   ssh-keygen -t ed25519 -C "deploy" -f deploy_key
   # Add deploy_key.pub to your VPS: ~/.ssh/authorized_keys
   # Add deploy_key (private) to GitHub secrets as VPS_SSH_KEY
   ```

4. Every push to `main` will automatically build and deploy!

---

## Backup

### Manual Backup
```bash
# On VPS
docker compose exec nestkeeper cp /app/data/nestkeeper.db /app/data/backup.db
docker cp nestkeeper-nestkeeper-1:/app/data/backup.db ./nestkeeper-backup.db
```

### Restore
```bash
docker cp ./nestkeeper-backup.db nestkeeper-nestkeeper-1:/app/data/nestkeeper.db
docker compose restart nestkeeper
```

---

## Monitoring

Check logs:
```bash
docker compose logs -f nestkeeper
```

Check status:
```bash
docker compose ps
```

---

## Costs Summary

| Item | Monthly Cost |
|------|-------------|
| VPS (Hetzner CX11) | €3.79 |
| Domain | ~$0.80 |
| **Total** | **~$5/month** |

HTTPS is free via Let's Encrypt (handled automatically by Caddy).
