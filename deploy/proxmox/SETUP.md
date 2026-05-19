# Deploy NestKeeper on Proxmox LXC (Cloudflare Tunnel + Access)

Self-hosted on a Proxmox LXC, exposed via Cloudflare Tunnel at `nestkeeper.pp.ua`, locked down with Cloudflare Access (only two Google-allowlisted emails can reach the app at all).

No inbound ports opened on your router. Origin IP hidden from the public internet.

## Prerequisites

- Proxmox VE host
- LXC container with internet access
- Domain `nestkeeper.pp.ua` on Cloudflare nameservers (already done)
- A Google account for each person who should access the app

## Step 1: Create the LXC container

1. Proxmox UI → local storage → CT Templates → download `ubuntu-22.04-standard` if not present.
2. Click **Create CT**:
   - **General:** CT ID e.g. 200, hostname `nestkeeper`, set a root password
   - **Template:** `ubuntu-22.04-standard`
   - **Disks:** 8 GB recommended
   - **CPU:** 1 core
   - **Memory:** 512 MB RAM, 256 MB swap
   - **Network:** Bridge `vmbr0`, DHCP is fine (no public IP needed — outbound only)
3. **Enable nesting** (required for Docker): Container → Options → Features → check **Nesting**. If you need FUSE, check that too.
4. Start the container.

## Step 2: Create the Cloudflare Tunnel

In the Cloudflare dashboard:

1. Open **Zero Trust** (zero-trust dashboard).
2. **Networks → Tunnels → Create a tunnel**.
3. Connector: **Cloudflared**. Tunnel name: `nestkeeper`. Save.
4. The next screen shows install instructions for various platforms — pick **Docker**. **Copy the long token** that follows `--token` in the displayed `docker run` command. (This is what you'll paste into `setup.sh`.)
5. Click **Next** to go to the **Public Hostname** step:
   - **Subdomain:** `nestkeeper`
   - **Domain:** `pp.ua`
   - **Path:** leave blank
   - **Type:** `HTTP`
   - **URL:** `nestkeeper:3000`
6. **Save tunnel**. Cloudflare will auto-create a CNAME DNS record for `nestkeeper.pp.ua`.

## Step 3: Create the Cloudflare Access application

In **Zero Trust → Access → Applications**:

1. **Add an application → Self-hosted**.
2. **Application name:** `NestKeeper`
3. **Session duration:** `24 hours`
4. **Application domain:** `nestkeeper.pp.ua`
5. **Identity providers:** check **Google** (Cloudflare provides this built-in; click it and follow the one-time consent flow if it's your first Access app).
6. Next → **Add a policy**:
   - **Policy name:** `Owners`
   - **Action:** `Allow`
   - **Configure rules → Include → Selector: Emails → Value:** add `admin@pbxes.com.ua` and `vshabat64@gmail.com`.
7. Save. Skip CORS, advanced, etc.

## Step 4: Run setup on the LXC

SSH to the LXC and run:

```bash
apt update && apt install -y curl
curl -fsSL https://raw.githubusercontent.com/Leev1tan/nestkeeper/main/deploy/proxmox/setup.sh -o setup.sh
bash setup.sh
```

The script will prompt for the Cloudflare Tunnel token (from Step 2.4). Paste it. The script then installs Docker, writes `/opt/nestkeeper/docker-compose.yml` and `/opt/nestkeeper/.env`, and brings the stack up.

## Step 5: Verify

```bash
# Containers running?
docker compose -f /opt/nestkeeper/docker-compose.yml ps

# Tunnel registered?
docker compose -f /opt/nestkeeper/docker-compose.yml logs cloudflared | grep -i "registered tunnel connection"

# App healthy?
docker compose -f /opt/nestkeeper/docker-compose.yml exec nestkeeper wget -q -O- http://localhost:3000/api/health
```

Expected:
- `docker compose ps` shows both services running; `nestkeeper` shows `healthy`.
- `cloudflared` logs show one or more `Registered tunnel connection` lines.
- The health endpoint returns 200.

Then open `https://nestkeeper.pp.ua` in a browser:
1. Cloudflare Access login page → "Sign in with Google" → enter Google credentials for one of the allowlisted emails.
2. After successful login, the NestKeeper login page appears. Log in as normal.
3. Try from a different Google account (not allowlisted) → you should see Cloudflare's "access denied" page.

## Updating NestKeeper

```bash
cd /opt/nestkeeper
docker compose pull
docker compose up -d
```

Note: `cloudflared` is pinned to `cloudflare/cloudflared:2024.10.0`. `docker compose pull` will refresh `nestkeeper` to the latest image, but cloudflared stays on the pinned tag. To upgrade cloudflared, edit `image:` in `/opt/nestkeeper/docker-compose.yml` to a newer tag (see https://github.com/cloudflare/cloudflared/releases), then re-run `docker compose pull && docker compose up -d`.

## Backup & Restore

### Backup

```bash
cd /opt/nestkeeper
docker compose exec nestkeeper cp /app/data/nestkeeper.db /app/data/backup-$(date +%Y%m%d).db
docker cp $(docker compose ps -q nestkeeper):/app/data/backup-$(date +%Y%m%d).db ./
```

### Restore

```bash
cd /opt/nestkeeper
docker cp ./backup.db $(docker compose ps -q nestkeeper):/app/data/nestkeeper.db
docker compose restart nestkeeper
```

## Adding or removing allowed users

Edit the Access policy in **Zero Trust → Access → Applications → NestKeeper → Policies → Owners → Configure rules**. Add or remove emails. Changes take effect immediately. No LXC changes needed.

## Troubleshooting

### Docker won't start in LXC

Make sure **nesting** is enabled in Proxmox: Container → Options → Features → check `nesting`, then restart the container.

### `cloudflared` logs show authentication errors

The token in `/opt/nestkeeper/.env` is invalid, revoked, or for a different tunnel. Re-copy the token from Cloudflare → Zero Trust → Networks → Tunnels → `nestkeeper` → **Edit → Cloudflared → Reveal token**. Update `.env`, then:

```bash
cd /opt/nestkeeper
docker compose up -d cloudflared
```

### "DNS resolution failed" when visiting the URL

Cloudflare should have auto-created the CNAME for `nestkeeper.pp.ua` when you added the public hostname. Verify in Cloudflare → DNS → Records: you should see a CNAME for `nestkeeper` pointing to `<tunnel-uuid>.cfargotunnel.com`. If absent, re-save the public hostname in the tunnel config.

### App can't be reached even though tunnel is up

Confirm the public hostname URL is `nestkeeper:3000` (the **docker-compose service name**, not `localhost`). `cloudflared` runs in the same docker network as `nestkeeper`, so it resolves `nestkeeper` via docker DNS.

### Container can't pull images

```bash
ping -c 1 google.com
# if DNS fails inside the LXC:
echo "nameserver 1.1.1.1" > /etc/resolv.conf
```

## Resource Usage

- **RAM:** ~30 MB (Go app) + ~25 MB (cloudflared) = ~55 MB total
- **Disk:** ~150 MB (Docker images) + database growth
- **CPU:** Near zero at idle; cloudflared adds a small amount under load

## Security model

| Layer | Defends against |
|---|---|
| No open inbound ports | Port scanners, exposing home IP |
| Cloudflare Access (Google + email allowlist) | Random users hitting the app at all |
| App session auth | Compromised Cloudflare session or insider |
| TLS end-to-end | Snooping (browser↔CF: TLS; CF↔origin: mTLS over tunnel) |

The two allowlisted emails are the **only** identities that can reach the NestKeeper login page. Everyone else is blocked at Cloudflare's edge before the LXC sees a packet.
