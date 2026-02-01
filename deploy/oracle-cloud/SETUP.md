# NestKeeper on Oracle Cloud Always Free

**Cost: $0/month forever**

## What You Get (Free)

- 4 ARM CPU cores (Ampere A1)
- 24 GB RAM
- 200 GB block storage
- 10 TB outbound data/month
- Automatic HTTPS via Caddy

## Step 1: Create Oracle Cloud Account

1. Go to [oracle.com/cloud/free](https://www.oracle.com/cloud/free/)
2. Click "Start for free"
3. Fill in details (requires credit card for verification - won't be charged)
4. Choose your home region (pick closest to you)
5. Wait for account activation email

## Step 2: Create ARM Instance

1. Go to Oracle Cloud Console → Compute → Instances
2. Click "Create Instance"
3. Configure:
   - **Name**: `nestkeeper`
   - **Image**: Ubuntu 22.04 (or 24.04)
   - **Shape**: Click "Change Shape"
     - Select "Ampere" (ARM)
     - Shape: `VM.Standard.A1.Flex`
     - OCPUs: `4` (or less if capacity issues)
     - Memory: `24 GB` (or less)
   - **Networking**: Create new VCN or use existing
   - **SSH Keys**: Upload your public key or generate new

4. Click "Create"

> **"Out of capacity" error?** Try:
> - Different availability domain
> - Fewer OCPUs (start with 1, upgrade later)
> - Try again in a few hours
> - Different region (requires new tenancy)

## Step 3: Configure Firewall

In Oracle Cloud Console:

1. Go to Networking → Virtual Cloud Networks
2. Click your VCN → Security Lists → Default Security List
3. Add Ingress Rules:

| Source CIDR | Protocol | Dest Port | Description |
|-------------|----------|-----------|-------------|
| 0.0.0.0/0 | TCP | 80 | HTTP |
| 0.0.0.0/0 | TCP | 443 | HTTPS |

## Step 4: Connect & Setup

```bash
# SSH into your instance
ssh ubuntu@YOUR_INSTANCE_IP

# Run the setup script
curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/nestkeeper/main/deploy/oracle-cloud/setup.sh | bash
```

Or manually:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker

# Open firewall ports (Ubuntu firewall, separate from Oracle's)
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save

# Create app directory
sudo mkdir -p /opt/nestkeeper
sudo chown $USER:$USER /opt/nestkeeper
cd /opt/nestkeeper

# Download config files
curl -O https://raw.githubusercontent.com/YOUR_USERNAME/nestkeeper/main/deploy/oracle-cloud/docker-compose.yml
curl -O https://raw.githubusercontent.com/YOUR_USERNAME/nestkeeper/main/deploy/oracle-cloud/Caddyfile
```

## Step 5: Configure Domain

Edit the Caddyfile:
```bash
nano /opt/nestkeeper/Caddyfile
```

Replace `YOUR_DOMAIN.com` with your actual domain.

**DNS Setup:**
- Go to your domain registrar
- Add A record: `@` → `YOUR_INSTANCE_IP`
- (Optional) Add A record: `www` → `YOUR_INSTANCE_IP`

## Step 6: Deploy

```bash
cd /opt/nestkeeper
docker compose up -d
```

Wait 1-2 minutes for Caddy to get SSL certificate, then visit `https://yourdomain.com`

## Useful Commands

```bash
# View logs
docker compose logs -f

# Restart
docker compose restart

# Update to latest version
docker compose pull
docker compose up -d

# Backup database
docker cp nestkeeper-nestkeeper-1:/app/data/nestkeeper.db ./backup.db

# Check disk space
df -h
```

## Troubleshooting

**Can't connect to instance?**
- Check Oracle Security List (ingress rules)
- Check Ubuntu firewall: `sudo iptables -L`
- Verify instance is running in Oracle Console

**SSL not working?**
- Ensure DNS is pointing to your IP: `dig yourdomain.com`
- Check Caddy logs: `docker compose logs caddy`
- Make sure ports 80 and 443 are open

**Out of memory?**
- Unlikely with 24GB, but check: `free -h`
- Check Docker: `docker stats`
