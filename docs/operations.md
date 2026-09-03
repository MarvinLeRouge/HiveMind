🇬🇧 English | [🇫🇷 Français](operations.fr.md)

# HiveMind - Operations

[← Back to README](../README.md)

---

## Table of contents

- [Local development](#local-development)
- [Docker](#docker)
- [CI/CD pipeline](#cicd-pipeline)
- [Production deployment](#production-deployment)
- [Backup & restore](#backup--restore)

---

## Local development

### Prerequisites

- Node.js 20 LTS
- pnpm 9+
- Docker + Docker Compose
- Traefik running locally with a `traefik-public` Docker network
- `hivemind.marvinlerouge.local` added to `/etc/hosts`:

```bash
echo "127.0.0.1 hivemind.marvinlerouge.local" | sudo tee -a /etc/hosts
```

### Setup

```bash
# Clone the repository
git clone https://github.com/MarvinLeRouge/HiveMind.git
cd HiveMind

# Install dependencies
pnpm install

# Copy environment files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Start the full stack (backend · frontend · database)
docker compose up -d

# Apply migrations and seed the database
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma db seed
```

The app is now running:

| Service | URL |
|---------|-----|
| Frontend | http://hivemind.marvinlerouge.local |
| API | http://hivemind.marvinlerouge.local/api |
| Swagger UI | http://hivemind.marvinlerouge.local/api/docs |

The default admin credentials are defined in `apps/api/.env` (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`).

---

## Docker

### Development stack

| Service | Description | Port |
|---------|-------------|------|
| `backend` | Fastify API with hot reload | 3000 |
| `frontend` | Vite dev server | 5173 |
| `db` | PostgreSQL 16 with named volume `pgdata` | 5432 |

```bash
# Start full dev stack
docker compose up -d

# Follow all logs
docker compose logs -f

# Follow backend logs only
docker compose logs -f backend

# Stop and remove containers
docker compose down
```

### Production stack

The production stack runs on a VPS behind Traefik with Let's Encrypt TLS. Containers are named `hivemind-backend`, `hivemind-frontend`, and `hivemind-db`. All services share the external `traefik-public` Docker network.

```bash
# Check production stack status
docker compose -f docker-compose.prod.yml ps

# Follow production logs
docker compose -f docker-compose.prod.yml logs -f backend
```

---

## CI/CD pipeline

### Pre-commit (automatic on every `git commit`)

Husky + lint-staged:

- `*.{ts,vue}` staged files → `eslint --fix` → `prettier --write`
- Commit is blocked if lint cannot auto-fix

### CI workflow (`ci.yml`)

Triggers on push + PR to `main`. Ignores `docs/**` and `**.md`. Uses `dorny/paths-filter` to skip unchanged apps.

| Job | Steps |
|-----|-------|
| `backend` | lint → typecheck → Vitest (unit + integration) → Codecov |
| `frontend` | lint → typecheck → Vitest → Codecov |

Coverage is uploaded to Codecov via OIDC - no token required for public repositories.

### E2E workflow (`e2e.yml`)

Triggers on push to `main` and `workflow_dispatch`. Builds the full production Docker stack, applies migrations, seeds the database, then runs all 35 Playwright tests. The CD workflow is gated on E2E success via `workflow_run`.

### CD workflow (`build-deploy.yml`)

Triggered by E2E workflow success via `workflow_run`, and on `workflow_dispatch` (hotfix bypass).

1. Resolve exact commit SHA + lowercase repository name
2. Build and push `backend` + `frontend` Docker images to GHCR (tagged `sha` + `latest`)
   - Frontend receives `VITE_API_BASE_URL` as a build argument (baked at build time by Vite)
3. SSH deploy to VPS:
   - Fetch `docker-compose.prod.yml` at exact SHA
   - Pull new images
   - Start database, wait for health check
   - Run `prisma migrate deploy`
   - Start all services with `--remove-orphans`

---

## Production deployment

### First deployment

Required GitHub secrets:

| Secret | Description |
|--------|-------------|
| `DEPLOY_SSH_HOST` | VPS hostname or IP |
| `DEPLOY_SSH_USER` | SSH user on the VPS |
| `DEPLOY_SSH_PRIVATE_KEY` | SSH private key with access to the VPS |
| `VITE_API_BASE_URL` | Public API URL baked into the frontend (e.g. `https://example.com/api`) |

The VPS must have Docker installed, the `traefik-public` Docker network created, and a production `.env` file at the path referenced in `docker-compose.prod.yml`.

On first deployment, seed the database manually:

```bash
docker exec hivemind-backend node node_modules/.bin/prisma db seed
```

### Manual deployment

To trigger a manual deployment: go to **Actions → Build & Deploy → Run workflow** on GitHub.

---

## Backup & restore

The production database is backed up daily via a cron job running on the VPS (`0 2 * * *`). Backups are gzip-compressed `pg_dump` exports with the following rotation:

- **7 daily backups** - one per day, overwritten after 7 days
- **4 weekly backups** - every Sunday, overwritten after 4 weeks

### Restore procedure

```bash
# 1. Copy the backup file to the VPS if needed
scp backup.sql.gz user@vps:/tmp/

# 2. Create a temporary database for verification
docker exec hivemind-db createdb -U HiveMind hivemind_restore

# 3. Restore into the temporary database
gunzip -c /tmp/backup.sql.gz | docker exec -i hivemind-db psql -U HiveMind -d hivemind_restore

# 4. Verify the restore (table count, row counts, spot checks)
docker exec -it hivemind-db psql -U HiveMind -d hivemind_restore -c "\dt"

# 5. If verified, stop the stack, restore into the live database, then restart
docker compose -f docker-compose.prod.yml down
gunzip -c /tmp/backup.sql.gz | docker exec -i hivemind-db psql -U HiveMind -d HiveMind
docker compose -f docker-compose.prod.yml up -d
```
