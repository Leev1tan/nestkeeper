# Cloudflare Tunnel + Access deployment for `nestkeeper.pp.ua`

**Date:** 2026-05-19
**Status:** Approved — ready for implementation plan
**Domain:** `nestkeeper.pp.ua` (nameservers already on Cloudflare)
**Target host:** Proxmox LXC (existing config in `deploy/proxmox/`)

## Goal

Expose the self-hosted NestKeeper app at `https://nestkeeper.pp.ua` without opening any inbound ports on the home router, and restrict access to two pre-approved Google accounts. Cloudflare Tunnel carries traffic; Cloudflare Access enforces identity at the edge before requests reach the LXC.

## Architecture

```
[browser] --TLS--> [Cloudflare edge]
                       |
                       | Access login wall (Google OAuth, 2-email allowlist)
                       |
                       v
                   [mTLS tunnel, outbound-initiated]
                       |
                       v
              [cloudflared container in LXC]
                       |
                       | plain HTTP, docker network
                       v
              [nestkeeper Go app :3000]
```

No inbound ports open on the router. `cloudflared` initiates an outbound HTTPS connection to Cloudflare; all user traffic returns via that tunnel. Cloudflare terminates TLS for the public hostname using its managed cert.

## Components

### Cloudflare side (one-time, in dashboard)

1. **Tunnel** — Zero Trust → Networks → Tunnels → create named tunnel `nestkeeper`. Cloudflare issues a tunnel token (secret).
2. **Public hostname for the tunnel** — `nestkeeper.pp.ua` → service `http://nestkeeper:3000` (docker DNS name inside the LXC's compose network). Cloudflare auto-creates the CNAME DNS record; no manual A record needed.
3. **Access application** — Zero Trust → Access → Applications → Add a self-hosted app for `nestkeeper.pp.ua`.
   - Identity provider: Google (built-in, no Workspace required).
   - Policy: action `Allow`, include `emails: { admin@pbxes.com.ua, vshabat64@gmail.com }`.
   - Session duration: 24h.

### LXC side (changes in `deploy/proxmox/`)

**`docker-compose.yml`:**
- Remove the `caddy` service entirely.
- Remove `ports: ["80:80", "443:443"]` — nothing public on the LXC.
- Add a `cloudflared` service:
  - `image: cloudflare/cloudflared:latest`
  - `command: tunnel --no-autoupdate run --token ${CF_TUNNEL_TOKEN}`
  - `restart: unless-stopped`
  - On the same `web` network as `nestkeeper`
  - `depends_on: { nestkeeper: { condition: service_healthy } }`
- Keep the `nestkeeper` service unchanged (it stays on the internal network; only `cloudflared` reaches it).

**`.env` template (`.env.example`, committed):**
```
CF_TUNNEL_TOKEN=paste-tunnel-token-here
```
The real `.env` is `.gitignore`d.

**`setup.sh`:**
- Prompt for tunnel token instead of DuckDNS subdomain.
- Drop Let's Encrypt readiness checks (Cloudflare handles TLS).
- Write `CF_TUNNEL_TOKEN` to `/opt/nestkeeper/.env`.

**`SETUP.md`:**
- Replace DuckDNS section with the Cloudflare dashboard walkthrough (create tunnel → add public hostname → create Access app).
- Update verification steps (no port-forwarding section; no `curl` against :80; check `cloudflared` logs for `Registered tunnel connection`).

**Removed from the repo:**
- `deploy/cloudflared.service` — was a *quick tunnel* using `--url http://localhost:3000`, which produces a random ephemeral `trycloudflare.com` URL. Superseded by the named tunnel running in Docker.
- `deploy/proxmox/Caddyfile` — Cloudflare terminates TLS; Caddy is redundant.

## Setup flow (the one-time human steps)

1. Cloudflare dashboard: create tunnel `nestkeeper`, copy token.
2. Cloudflare dashboard: add public hostname → `nestkeeper.pp.ua` → `http://nestkeeper:3000`.
3. Cloudflare dashboard: create Access app + Google IdP + email allowlist.
4. SSH to LXC: `git pull`, copy `.env.example` → `.env`, paste token.
5. `docker compose up -d`.
6. Visit `https://nestkeeper.pp.ua` → Google login → NestKeeper login.

## Security model

| Layer | Defends against |
|-------|-----------------|
| No open inbound ports on router | Port scanners, opportunistic exploits, exposing home IP |
| Cloudflare Access (Google IdP + email allowlist) | Random users reaching the login page; brute-force; vuln probes |
| App's own session auth | Compromised Cloudflare session; allowlisted user who shouldn't have data |
| TLS end-to-end | Network snooping (browser↔CF: TLS; CF↔origin: mTLS over tunnel) |

The two allowlisted emails are the *only* identities that can reach `https://nestkeeper.pp.ua` at all. Everyone else is bounced at Cloudflare's edge.

## Trade-offs accepted

- **Cloudflare can decrypt edge traffic.** Already trust them with DNS; security gain (hidden origin + Access wall) is judged worth it for a personal landlord tool.
- **100 MB per-request body limit (Cloudflare free tier).** Receipt photos / maintenance PDFs are well under this. Large uploads → R2 + presigned URLs, future work.
- **Mild vendor lock-in.** Go app is untouched. Switching to direct A-record + Caddy later is a half-day of work.

## Out of scope (deliberately)

- Backup automation (snippets exist in current SETUP.md; off-LXC cron job is a separate spec).
- CI/CD via GitHub Actions.
- Monitoring / uptime.
- Multi-tenant Access policies (single-user lockdown chosen explicitly).
- Migrating away from Cloudflare (hypothetical, not planned).

## Success criteria

- `curl -I https://nestkeeper.pp.ua` from an unauthenticated client returns a Cloudflare Access redirect (not the app's HTML, not a connection refused).
- After Google login as `admin@pbxes.com.ua` or `vshabat64@gmail.com`, browser reaches the NestKeeper login page.
- After Google login as any other email, Cloudflare displays "access denied".
- `nmap` against the home public IP on ports 80/443 shows them closed/filtered.
- `docker compose logs cloudflared` shows `Registered tunnel connection` to at least one Cloudflare edge.
- LXC keeps running through `docker compose down && up -d` without manual intervention.

## Open questions for the implementation plan

- Whether to pin `cloudflared` to a specific image tag (e.g., `2024.x.x`) vs `latest`. Default to a pinned tag for reproducibility; document upgrade procedure.
- Whether `setup.sh` should call the Cloudflare API to provision the tunnel and Access app, or stay manual (dashboard). Default to manual — the dashboard is one-time, scripts mean managing an API token.
- Whether to keep `deploy/oracle-cloud/` (current public-IP + Caddy flow) or remove it. Default to keep — it serves a different deployment scenario (cloud VPS, no NAT, no Cloudflare).
