# Deploy NestKeeper on Proxmox LXC

Free deployment using your Proxmox server + DuckDNS. Total cost: $0.

## Prerequisites

- Proxmox VE host with a public IP (or port forwarding for 80/443)
- Internet access from the LXC container

## Step 1: Create LXC Container in Proxmox

1. **Download template** (if not already available):
   - Proxmox UI → local storage → CT Templates → Templates
   - Download: `ubuntu-22.04-standard`

2. **Create container:**
   - Click "Create CT" in top right
   - **General:** Pick a CT ID (e.g., 200), set hostname to `nestkeeper`, set a root password
   - **Template:** Select `ubuntu-22.04-standard`
   - **Disks:** 4 GB (minimum, 8 GB recommended)
   - **CPU:** 1 core
   - **Memory:** 512 MB RAM, 256 MB swap
   - **Network:** Bridge `vmbr0`, set your public IP (static) or DHCP

3. **Enable nesting (REQUIRED for Docker):**
   - Select your container → Options → Features
   - Check **Nesting**
   - If you need FUSE (for overlayfs): also check **FUSE**

4. **Start the container**

## Step 2: Get a Free Domain (DuckDNS)

1. Go to [duckdns.org](https://www.duckdns.org)
2. Login with Google/GitHub/Reddit
3. Create a subdomain (e.g., `nestkeeper` → gives you `nestkeeper.duckdns.org`)
4. Set the IP to your server's public IP
5. Click "update ip"

## Step 3: Run Setup Script

SSH into your LXC container and run:

```bash
apt update && apt install -y curl
curl -fsSL https://raw.githubusercontent.com/Leev1tan/nestkeeper/main/deploy/proxmox/setup.sh -o setup.sh
bash setup.sh
```

The script will:
- Ask for your DuckDNS subdomain
- Install Docker
- Create the config files
- Pull and start NestKeeper + Caddy
- Set up auto HTTPS via Let's Encrypt

## Step 4: Verify

```bash
# Check containers are running
docker compose -f /opt/nestkeeper/docker-compose.yml ps

# Check health
curl http://localhost:3000/api/health

# Check logs if something is wrong
docker compose -f /opt/nestkeeper/docker-compose.yml logs -f
```

Then open `https://YOUR_SUBDOMAIN.duckdns.org` in your browser.

## Updating NestKeeper

When a new version is pushed to GitHub:

```bash
cd /opt/nestkeeper
docker compose pull
docker compose up -d
```

## Backup & Restore

### Backup
```bash
cd /opt/nestkeeper
docker compose exec nestkeeper cp /app/data/nestkeeper.db /app/data/backup-$(date +%Y%m%d).db
# Copy to host
docker cp $(docker compose ps -q nestkeeper):/app/data/backup-$(date +%Y%m%d).db ./
```

### Restore
```bash
cd /opt/nestkeeper
docker cp ./backup.db $(docker compose ps -q nestkeeper):/app/data/nestkeeper.db
docker compose restart nestkeeper
```

## Troubleshooting

### Docker won't start in LXC
Make sure **nesting** is enabled:
```
Proxmox UI → Container → Options → Features → check "nesting"
```
Then restart the container from Proxmox UI.

### HTTPS not working / SSL error
- Make sure ports 80 and 443 are reachable from the internet
- Check that your DuckDNS IP matches your server: `curl ifconfig.me`
- Wait 1-2 minutes for Let's Encrypt to issue the certificate
- Check Caddy logs: `docker compose logs caddy`

### Container can't pull images
```bash
# Check DNS
ping -c 1 google.com

# If DNS fails, set it manually
echo "nameserver 8.8.8.8" > /etc/resolv.conf
```

### Port forwarding (if LXC has private IP)
On your Proxmox host, forward ports 80/443 to the LXC:
```bash
# Replace LXC_IP with your container's IP
iptables -t nat -A PREROUTING -i vmbr0 -p tcp --dport 80 -j DNAT --to LXC_IP:80
iptables -t nat -A PREROUTING -i vmbr0 -p tcp --dport 443 -j DNAT --to LXC_IP:443
iptables -t nat -A POSTROUTING -o vmbr0 -j MASQUERADE
```

## Resource Usage

NestKeeper is lightweight:
- **RAM:** ~30 MB (app) + ~15 MB (Caddy) = ~45 MB total
- **Disk:** ~200 MB (Docker images) + database
- **CPU:** Near zero at idle
