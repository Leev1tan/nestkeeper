# Cloudflare Tunnel + Access deployment — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert `deploy/proxmox/` from DuckDNS + Caddy + Let's Encrypt to Cloudflare Tunnel + Cloudflare Access for `nestkeeper.pp.ua`, restricted to two Google-allowlisted emails. No inbound ports on the home router.

**Architecture:** A `cloudflared` sidecar container in the LXC opens an outbound mTLS tunnel to Cloudflare. Cloudflare terminates TLS at the edge and enforces Access (Google OAuth + email allowlist) before forwarding any request through the tunnel to the Go app at `http://nestkeeper:3000`. No Caddy, no Let's Encrypt, no public ports.

**Tech Stack:** Docker Compose, `cloudflare/cloudflared:2024.10.0` (pinned), Cloudflare Tunnel (named, token-auth), Cloudflare Access (Google IdP), Bash. Spec: `docs/superpowers/specs/2026-05-19-cloudflare-tunnel-access-deployment-design.md`.

## File structure

Each file has one clear responsibility:

| File | Responsibility |
|---|---|
| `deploy/proxmox/docker-compose.yml` | Defines `nestkeeper` + `cloudflared` services; **no public ports** |
| `deploy/proxmox/.env.example` | Template showing `CF_TUNNEL_TOKEN` is required; copied to `.env` at setup |
| `deploy/proxmox/setup.sh` | One-shot installer: prompts for token, writes `.env`, brings stack up |
| `deploy/proxmox/SETUP.md` | Human runbook: Cloudflare dashboard steps + LXC steps |
| ~~`deploy/proxmox/Caddyfile`~~ | **DELETED** (Cloudflare handles TLS) |
| ~~`deploy/cloudflared.service`~~ | **DELETED** (was a quick-tunnel systemd unit; superseded) |

Top-level `.gitignore` already ignores `.env` globally, so `deploy/proxmox/.env` is safely ignored — verified in Task 1.

---

### Task 1: Add `.env.example` and verify ignore

**Files:**
- Create: `deploy/proxmox/.env.example`
- Verify: top-level `.gitignore` already covers `.env`

- [ ] **Step 1: Verify .env will be ignored**

Run:
```powershell
git check-ignore -v deploy/proxmox/.env
```
Expected: a line like `.gitignore:34:.env   deploy/proxmox/.env` (line number may vary). If `git check-ignore` produces no output, `.env` would be tracked — STOP and add `deploy/proxmox/.env` to `.gitignore` before proceeding.

- [ ] **Step 2: Create `.env.example`**

Create `deploy/proxmox/.env.example` with this content (one trailing newline):

```dotenv
# Cloudflare Tunnel token (long string from the Cloudflare Zero Trust dashboard).
# Generate via: Zero Trust > Networks > Tunnels > Create tunnel "nestkeeper" > Copy the token shown after picking Docker as the connector.
# Treat as secret. Do not commit the real .env (it's gitignored).
CF_TUNNEL_TOKEN=
```

- [ ] **Step 3: Verify file content**

Run:
```powershell
Get-Content deploy/proxmox/.env.example
```
Expected: matches the content above exactly.

- [ ] **Step 4: Commit**

```bash
git add deploy/proxmox/.env.example
git commit -m "Add Cloudflare Tunnel token env template for Proxmox deploy"
```

---

### Task 2: Rewrite `deploy/proxmox/docker-compose.yml`

**Files:**
- Modify: `deploy/proxmox/docker-compose.yml` (full replace)

- [ ] **Step 1: Confirm current state (the "failing test")**

Run:
```powershell
Select-String -Path deploy/proxmox/docker-compose.yml -Pattern 'caddy|80:80|443:443'
```
Expected: multiple matches showing `caddy` service block and the `80:80` / `443:443` port mappings exist. This is the state we are removing.

- [ ] **Step 2: Replace file content**

Overwrite `deploy/proxmox/docker-compose.yml` with exactly:

```yaml
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
```

Key changes vs. the previous file:
- `caddy` service removed.
- All `ports:` mappings removed (no inbound on the LXC).
- `cloudflared` service added, pinned to `2024.10.0`, sources `CF_TUNNEL_TOKEN` from `.env`.
- `caddy-data` and `caddy-config` volumes removed.

- [ ] **Step 3: Validate compose syntax**

Compose validation requires `.env` to exist with `CF_TUNNEL_TOKEN` defined. Create a *throwaway* `.env` for the validation pass only:

```powershell
"CF_TUNNEL_TOKEN=placeholder" | Set-Content -Encoding utf8 deploy/proxmox/.env
docker compose -f deploy/proxmox/docker-compose.yml config | Out-Null
echo "exit code: $LASTEXITCODE"
Remove-Item deploy/proxmox/.env
```
Expected: `exit code: 0`. No error output. (If Docker isn't installed locally on Windows, skip this step and validate it on the LXC instead at deployment time.)

- [ ] **Step 4: Confirm Caddy and ports are gone**

Run:
```powershell
Select-String -Path deploy/proxmox/docker-compose.yml -Pattern 'caddy|80:80|443:443'
```
Expected: no matches.

- [ ] **Step 5: Commit**

```bash
git add deploy/proxmox/docker-compose.yml
git commit -m "Replace Caddy with cloudflared tunnel sidecar in Proxmox compose"
```

---

### Task 3: Delete `deploy/proxmox/Caddyfile`

**Files:**
- Delete: `deploy/proxmox/Caddyfile`

- [ ] **Step 1: Confirm file exists**

Run:
```powershell
Test-Path deploy/proxmox/Caddyfile
```
Expected: `True`.

- [ ] **Step 2: Remove file**

```bash
git rm deploy/proxmox/Caddyfile
```

- [ ] **Step 3: Verify removal**

Run:
```powershell
Test-Path deploy/proxmox/Caddyfile
```
Expected: `False`.

- [ ] **Step 4: Commit**

```bash
git commit -m "Remove Proxmox Caddyfile (TLS now handled by Cloudflare Tunnel)"
```

---

### Task 4: Delete `deploy/cloudflared.service`

**Files:**
- Delete: `deploy/cloudflared.service`

- [ ] **Step 1: Confirm file is the obsolete quick-tunnel unit**

Run:
```powershell
Select-String -Path deploy/cloudflared.service -Pattern 'tunnel --url'
```
Expected: one match (`ExecStart=/usr/bin/cloudflared tunnel --url http://localhost:3000`). This confirms it is the ephemeral `trycloudflare.com` setup we are replacing.

- [ ] **Step 2: Remove file**

```bash
git rm deploy/cloudflared.service
```

- [ ] **Step 3: Verify removal**

Run:
```powershell
Test-Path deploy/cloudflared.service
```
Expected: `False`.

- [ ] **Step 4: Commit**

```bash
git commit -m "Remove obsolete cloudflared quick-tunnel systemd unit"
```

---

### Task 5: Rewrite `deploy/proxmox/setup.sh`

**Files:**
- Modify: `deploy/proxmox/setup.sh` (full replace)

- [ ] **Step 1: Confirm current state (the "failing test")**

Run:
```powershell
Select-String -Path deploy/proxmox/setup.sh -Pattern 'duckdns|Caddyfile|DUCK_SUBDOMAIN'
```
Expected: multiple matches showing DuckDNS prompts and Caddyfile generation are present.

- [ ] **Step 2: Replace file content**

Overwrite `deploy/proxmox/setup.sh` with exactly (preserve `#!/bin/bash` shebang as the first line, no BOM):

```bash
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
read -p "Paste the Cloudflare Tunnel token: " CF_TUNNEL_TOKEN
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
```

Key changes vs. the previous file:
- DuckDNS prompt → Cloudflare tunnel token prompt.
- Caddyfile generation removed.
- `.env` is written with `umask 077` so it's root-readable only.
- Embedded `docker-compose.yml` matches Task 2 exactly.
- Final message references `https://nestkeeper.pp.ua` and the Access flow.

- [ ] **Step 3: Bash syntax check**

Run:
```powershell
bash -n deploy/proxmox/setup.sh; echo "exit: $LASTEXITCODE"
```
Expected: `exit: 0` with no output above. (If `bash` is not on PATH on Windows, run this in WSL or skip and validate on the LXC.)

- [ ] **Step 4: Confirm DuckDNS / Caddy references are gone**

Run:
```powershell
Select-String -Path deploy/proxmox/setup.sh -Pattern 'duckdns|Caddyfile|DUCK_SUBDOMAIN'
```
Expected: no matches.

- [ ] **Step 5: Commit**

```bash
git add deploy/proxmox/setup.sh
git commit -m "Rewrite Proxmox setup.sh for Cloudflare Tunnel deploy"
```

---

### Task 6: Rewrite `deploy/proxmox/SETUP.md`

**Files:**
- Modify: `deploy/proxmox/SETUP.md` (full replace)

- [ ] **Step 1: Confirm current state**

Run:
```powershell
Select-String -Path deploy/proxmox/SETUP.md -Pattern 'duckdns|DuckDNS'
```
Expected: multiple matches in the DuckDNS section.

- [ ] **Step 2: Replace file content**

Overwrite `deploy/proxmox/SETUP.md` with exactly:

````markdown
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
````

- [ ] **Step 3: Confirm DuckDNS references are gone**

Run:
```powershell
Select-String -Path deploy/proxmox/SETUP.md -Pattern 'duckdns|DuckDNS'
```
Expected: no matches.

- [ ] **Step 4: Spot-check rendered links**

Run:
```powershell
Select-String -Path deploy/proxmox/SETUP.md -Pattern 'http://nestkeeper:3000|nestkeeper.pp.ua' | Select-Object -First 5
```
Expected: at least 3 matches (referenced in tunnel setup, Access app, and verification sections).

- [ ] **Step 5: Commit**

```bash
git add deploy/proxmox/SETUP.md
git commit -m "Rewrite Proxmox SETUP.md for Cloudflare Tunnel + Access flow"
```

---

### Task 7: Final repo-wide sweep for stale references

**Files:**
- Read-only verification across `deploy/`

- [ ] **Step 1: Search for any remaining DuckDNS / Caddy / Let's Encrypt mentions in the Proxmox deploy**

Run:
```powershell
Select-String -Path deploy/proxmox/* -Pattern 'duckdns|DuckDNS|caddy|Caddy|Let''s Encrypt|letsencrypt' -CaseSensitive:$false
```
Expected: no matches. If any appear, edit them out and commit.

- [ ] **Step 2: Confirm the deleted files are not referenced elsewhere**

Run:
```powershell
Select-String -Path deploy/* -Pattern 'cloudflared.service|Caddyfile' -Recurse
```
Expected: no matches. (The `deploy/oracle-cloud/Caddyfile` is a different file in a different deployment path — it's allowed to stay; verify the match shown is only under `deploy/proxmox/` if any.)

If any references to `deploy/cloudflared.service` or `deploy/proxmox/Caddyfile` appear, fix them and commit with `git commit -m "Remove stale references to deleted deployment files"`.

- [ ] **Step 3: Verify git status is clean**

Run:
```bash
git status
```
Expected: `nothing to commit, working tree clean` (the `nul` untracked file from the initial state may still be there — that's unrelated to this work).

- [ ] **Step 4: View the commit log of this work**

Run:
```bash
git log --oneline -10
```
Expected: at least 6 new commits (Task 1–6), in order, all with clear messages.

---

## Post-implementation: deployment walkthrough

After the repo changes are merged, perform the one-time human deployment (not part of the plan tasks because it requires interactive dashboard work and access to the LXC):

1. **Cloudflare dashboard** (10 min): Steps 2 and 3 of `SETUP.md` — create tunnel, add public hostname, create Access app, copy token.
2. **LXC** (5 min): SSH in, `curl … setup.sh`, `bash setup.sh`, paste token.
3. **Verify**: Step 5 of `SETUP.md` — `docker compose ps`, check `cloudflared` logs, open the URL in a browser and walk through the Google login.

Done. The app is live at `https://nestkeeper.pp.ua`, locked to the two allowlisted emails.

---

## Self-review notes (already addressed)

- **Spec coverage:** Every change called out in the spec maps to a task — docker-compose rewrite (T2), Caddyfile delete (T3), cloudflared.service delete (T4), setup.sh rewrite (T5), SETUP.md rewrite (T6), `.env.example` add (T1). Access policy and tunnel creation are deliberately runbook (SETUP.md) rather than code, matching the spec's "manual dashboard, not API" decision.
- **Placeholders:** None. Every file content step shows the complete file.
- **Type consistency:** `nestkeeper:3000`, `CF_TUNNEL_TOKEN`, `cloudflare/cloudflared:2024.10.0`, `web` network — all spelled identically across tasks.
- **No untested claims:** Each rewrite has a before-state grep, a content step, and an after-state verification.
