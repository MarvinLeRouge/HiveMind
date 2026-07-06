🇬🇧 English | [🇫🇷 Français](README.fr.md)

# HiveMind

> A collaborative platform for solving puzzle collections asynchronously.

[![Status](https://img.shields.io/badge/status-in%20development-yellow)](https://github.com/MarvinLeRouge/HiveMind)
[![CI](https://github.com/MarvinLeRouge/HiveMind/actions/workflows/ci.yml/badge.svg)](https://github.com/MarvinLeRouge/HiveMind/actions/workflows/ci.yml)
[![E2E](https://github.com/MarvinLeRouge/HiveMind/actions/workflows/e2e.yml/badge.svg)](https://github.com/MarvinLeRouge/HiveMind/actions/workflows/e2e.yml)
[![CD](https://github.com/MarvinLeRouge/HiveMind/actions/workflows/build-deploy.yml/badge.svg)](https://github.com/MarvinLeRouge/HiveMind/actions/workflows/build-deploy.yml)
[![Node.js](https://img.shields.io/badge/node-20%20LTS-brightgreen?logo=node.js)](https://nodejs.org)
[![Fastify](https://img.shields.io/badge/fastify-5-black?logo=fastify)](https://fastify.dev)
[![Vue.js](https://img.shields.io/badge/vue-3-42b883?logo=vue.js)](https://vuejs.org)
[![PostgreSQL](https://img.shields.io/badge/postgresql-16-336791?logo=postgresql)](https://www.postgresql.org)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Backend coverage](https://img.shields.io/codecov/c/github/MarvinLeRouge/HiveMind/main?flag=backend&label=backend&logo=codecov)](https://app.codecov.io/gh/MarvinLeRouge/HiveMind)
[![Frontend coverage](https://img.shields.io/codecov/c/github/MarvinLeRouge/HiveMind/main?flag=frontend&label=frontend&logo=codecov)](https://app.codecov.io/gh/MarvinLeRouge/HiveMind)

---

## Concept

Puzzle collections are hard to solve alone. HiveMind makes it simple for a team to tackle them together — tracking who is working on what, recording notes and tested solutions, and progressing toward a final answer.

The domain is intentionally generic: geocaching mystery series, CTF challenges, escape room puzzles, treasure hunts, logic puzzle sets — any collection of enigmas that benefits from collaborative tracking.

Each **Collection** contains **Puzzles**. Each puzzle can carry free-text **Notes** (observations, hypotheses) and **Attempts** (concrete values tested against an optional verification URL). A flexible **Template** system lets each collection expose only the fields that matter for its puzzle type.

---

## Key figures

| Metric | Value |
|--------|-------|
| API endpoints | 42 (auth, templates, collections, invitations, puzzles, notes, attempts, import) |
| Backend test coverage | ≥ 97 % |
| Frontend test coverage | ≥ 92 % |
| Languages | EN, FR (per-user preference) |
| E2E tests | 35 (auth, collections, puzzles, notes, attempts, import) |

---

## Features

- **Collections** — create and name a puzzle collection, configure which fields are active
- **Puzzles** — add puzzles with optional metadata: coordinates, difficulty/terrain ratings, hint, spoiler, custom fields
- **Notes** — per-author, timestamped free-text observations on each puzzle
- **Attempts** — immutable records of values tested, with pass/fail result and optional comment
- **Checker URL** — attach an external verification link to a puzzle; attempted values can be checked directly
- **Templates** — define which fields are active on puzzles; system templates provided out of the box (`generic`, `geocaching`)
- **Collaboration** — invite members by email; invitees receive an email with direct accept/decline links
- **Non-exclusive claiming** — any member can mark themselves as working on a puzzle; multiple members can claim the same puzzle simultaneously
- **Roles** — `owner` and `member` roles per collection; platform admins manage system templates
- **Multilingual UI** — EN/FR interface; language preference stored per user and synced across sessions
- **GPX import** — upload a Geocaching pocket query to auto-populate puzzles with coordinates, difficulty, terrain, and GC codes
- **CSV import** — upload a spreadsheet with flexible column-to-field mapping
- **JWT auth** — access token (15 min) + httpOnly refresh cookie (7 days)
- **Swagger UI** — auto-generated interactive API documentation at `/docs`

---

## Architecture

```
HiveMind/
├── apps/
│   ├── api/                    # Fastify 5 backend
│   │   ├── src/
│   │   │   ├── routes/         # Route definitions + Zod schemas
│   │   │   ├── controllers/    # Request/response handling
│   │   │   ├── services/       # Business logic
│   │   │   ├── repositories/   # Prisma data access
│   │   │   ├── middlewares/    # authenticate, requireMember, requireOwner
│   │   │   ├── plugins/        # Fastify plugins (swagger, jwt, cors, cookie, multipart)
│   │   │   └── types/          # Local TypeScript types
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   └── tests/
│   │       ├── unit/           # Service tests (repositories mocked)
│   │       └── integration/    # fastify.inject() endpoint tests
│   └── web/                    # Vue 3 frontend
│       ├── src/
│       │   ├── pages/          # Route-level components
│       │   ├── components/     # Reusable UI components (shadcn-vue)
│       │   ├── stores/         # Pinia stores
│       │   ├── router/         # Vue Router + auth guard
│       │   ├── composables/    # Shared composition functions
│       │   ├── i18n/           # vue-i18n setup + EN/FR locale files
│       │   └── types/          # Local TypeScript types
│       └── tests/
├── packages/
│   └── shared/                 # Shared TypeScript types + Zod schemas
│       └── src/
│           ├── schemas/        # Zod schemas shared between api and web
│           └── types/          # TypeScript types inferred from schemas
├── .github/workflows/
│   ├── ci.yml                  # Lint + unit + integration tests + Codecov
│   ├── e2e.yml                 # Playwright E2E (35 tests, Chromium, gates CD)
│   └── build-deploy.yml        # Build images + deploy to VPS
├── docker-compose.yml          # Dev stack (hot reload)
├── docker-compose.prod.yml     # Prod stack (Traefik labels)
└── pnpm-workspace.yaml
```

### Backend — layered service architecture

Controllers are thin: all business logic lives in services. Repositories handle all Prisma calls and expose no business logic.

### Frontend — Vue 3 Composition API

Pages delegate to Pinia stores. Components are reusable and shadcn-vue based. The ofetch client handles JWT headers and silent token refresh on 401.

---

## Testing

### Backend

```bash
pnpm --filter api test              # Run all tests
pnpm --filter api test:coverage     # With coverage report (target ≥ 80%)
```

- **Unit tests** — `apps/api/tests/unit/` — service logic, repositories mocked
- **Integration tests** — `apps/api/tests/integration/` — real Fastify instance via `fastify.inject()`
- Every endpoint is tested for the happy path + 401/403/404 scenarios
- Integration tests run against a dedicated test database to protect the dev database

#### Test database setup (local)

Integration tests require a separate PostgreSQL database. Create it once:

```bash
createdb HiveMind_test
```

Then add the connection string to `apps/api/.env`:

```env
DATABASE_URL_TEST=postgresql://postgres@localhost:5432/HiveMind_test
```

When `DATABASE_URL_TEST` is set, the test global setup applies migrations and seed to that database before the suite runs. In CI, there is no `DATABASE_URL_TEST` — the CI PostgreSQL service is used directly via `DATABASE_URL`.

### Frontend

```bash
pnpm --filter web test              # Run all tests
pnpm --filter web test:coverage     # With coverage report (target ≥ 80%)
```

- JSDOM environment, Vue Test Utils
- 26 test files covering pages (12), reusable components (5), Pinia stores (7), and utilities (2)

### E2E — Playwright

```bash
pnpm test:e2e       # Requires full Docker stack running
```

35 tests across 6 spec files in `e2e/` at monorepo root. Chromium only. Runs against the full production Docker stack (backend + frontend + DB + mailpit).

| Spec | Tests | Coverage |
|------|-------|----------|
| `auth.spec.ts` | 6 | login, wrong password, register, logout, redirect, i18n toggle |
| `collections.spec.ts` | 8 | create, view, settings, delete, invite, member/outsider access |
| `puzzles.spec.ts` | 10 | list, add, edit, claim/release, status advance, delete, member access |
| `notes.spec.ts` | 5 | add, edit, delete own note; member cannot edit owner's notes |
| `attempts.spec.ts` | 3 | record, immutability, chronological order |
| `import.spec.ts` | 3 | GPX import, CSV preview, CSV import |

---

## CI/CD

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

Coverage is uploaded to Codecov via OIDC — no token required for public repositories.

### E2E workflow (`e2e.yml`)

Triggers on push to `main` and `workflow_dispatch`. Builds the full production Docker stack, applies migrations, seeds the database, then runs all 35 Playwright tests. The CD workflow is gated on E2E success via `workflow_run`.

### CD workflow (`build-deploy.yml`)

Triggered on every push to `main` and on `workflow_dispatch` (hotfix bypass).

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

## Docker

### Development

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
docker compose logs -f api

# Stop and remove containers
docker compose down
```

### Production

The production stack runs on a VPS behind Traefik with Let's Encrypt TLS. Containers are named `hivemind-backend`, `hivemind-frontend`, and `hivemind-db`. All services share the external `traefik-public` Docker network.

```bash
# Check production stack status
docker compose -f docker-compose.prod.yml ps

# Follow production logs
docker compose -f docker-compose.prod.yml logs -f backend
```

---

## API endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /auth/register | — | Create account |
| POST | /auth/login | — | Get access token + set cookie |
| POST | /auth/refresh | — | Rotate tokens from cookie |
| POST | /auth/logout | ✓ | Clear refresh cookie |
| GET | /auth/me | ✓ | Return current user |
| PATCH | /auth/me | ✓ | Update language preference |
| GET | /templates | ✓ | List templates |
| POST | /templates | ✓ | Create user template |
| GET | /templates/:id | ✓ | Get template by ID |
| PATCH | /templates/:id | ✓ | Update own template |
| DELETE | /templates/:id | ✓ | Delete own template |
| POST | /templates/system | ✓ admin | Create system template |
| PATCH | /templates/system/:id | ✓ admin | Update system template |
| DELETE | /templates/system/:id | ✓ admin | Delete system template |
| GET | /collections | ✓ | List my collections |
| POST | /collections | ✓ | Create collection |
| GET | /collections/:id | ✓ member | Get collection |
| PATCH | /collections/:id | ✓ owner | Update collection |
| DELETE | /collections/:id | ✓ owner | Delete collection |
| GET | /collections/:id/members | ✓ member | List members |
| DELETE | /collections/:id/members/:userId | ✓ owner | Remove member |
| POST | /collections/:id/invitations | ✓ owner | Send invitation (email dispatched) |
| GET | /invitations/:id | ✓ | Get invitation |
| POST | /invitations/:id/accept | ✓ | Accept invitation |
| POST | /invitations/:id/decline | ✓ | Decline invitation |
| GET | /collections/:id/puzzles | ✓ member | List puzzles |
| POST | /collections/:id/puzzles | ✓ owner | Create puzzle |
| GET | /collections/:id/puzzles/:pid | ✓ member | Get puzzle |
| PATCH | /collections/:id/puzzles/:pid | ✓ member | Update puzzle |
| DELETE | /collections/:id/puzzles/:pid | ✓ owner | Delete puzzle |
| PATCH | /collections/:id/puzzles/reorder | ✓ owner | Bulk reorder |
| POST | /collections/:id/puzzles/:pid/claim | ✓ member | Add self as worker |
| DELETE | /collections/:id/puzzles/:pid/claim | ✓ member | Remove self as worker |
| GET | /puzzles/:pid/notes | ✓ member | List notes |
| POST | /puzzles/:pid/notes | ✓ member | Add note |
| PATCH | /puzzles/:pid/notes/:nid | ✓ author | Edit own note |
| DELETE | /puzzles/:pid/notes/:nid | ✓ author | Delete own note |
| GET | /puzzles/:pid/attempts | ✓ member | List attempts |
| POST | /puzzles/:pid/attempts | ✓ member | Add attempt |
| POST | /collections/:id/import/gpx | ✓ owner | Import GPX file |
| POST | /collections/:id/import/csv/preview | ✓ owner | Preview CSV columns |
| POST | /collections/:id/import/csv | ✓ owner | Import CSV with mapping |

---

## Installation

### Prerequisites

- Node.js 20 LTS
- pnpm 9+
- Docker + Docker Compose
- Traefik running locally with a `traefik-public` Docker network
- `hivemind.marvinlerouge.local` added to `/etc/hosts`:

```bash
echo "127.0.0.1 hivemind.marvinlerouge.local" | sudo tee -a /etc/hosts
```

### Local development

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

### Production deployment

The CD pipeline deploys automatically on every push to `main`. To trigger a manual deployment:

1. Go to **Actions → Build & Deploy → Run workflow** on GitHub.

Required GitHub secrets:

| Secret | Description |
|--------|-------------|
| `DEPLOY_SSH_HOST` | VPS hostname or IP |
| `DEPLOY_SSH_USER` | SSH user on the VPS |
| `DEPLOY_SSH_PRIVATE_KEY` | SSH private key with access to the VPS |
| `VITE_API_BASE_URL` | Public API URL baked into the frontend (e.g. `https://example.com/api`) |

The VPS must have Docker installed, the `traefik-public` Docker network created, and a production `.env` file at the path referenced in `docker-compose.prod.yml`.

On first deployment, run the database seed manually:

```bash
docker exec hivemind-backend node node_modules/.bin/prisma db seed
```

---

## Backup & restore

The production database is backed up daily via a cron job running on the VPS (`0 2 * * *`). Backups are gzip-compressed `pg_dump` exports with the following rotation:

- **7 daily backups** — one per day, overwritten after 7 days
- **4 weekly backups** — every Sunday, overwritten after 4 weeks

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

---

## Tech stack

| Layer | Technology | |
|-------|------------|--|
| Package manager | pnpm workspaces | [![pnpm](https://img.shields.io/badge/pnpm-9-f69220?logo=pnpm)](https://pnpm.io) |
| Runtime | Node.js 20 LTS | [![Node.js](https://img.shields.io/badge/node-20%20LTS-brightgreen?logo=node.js)](https://nodejs.org) |
| Backend | Fastify 5 + TypeScript | [![Fastify](https://img.shields.io/badge/fastify-5-black?logo=fastify)](https://fastify.dev) |
| Validation | Zod + fastify-type-provider-zod | [![Zod](https://img.shields.io/badge/zod-3-3e67b1)](https://zod.dev) |
| ORM | Prisma 6 | [![Prisma](https://img.shields.io/badge/prisma-6-2d3748?logo=prisma)](https://prisma.io) |
| Database | PostgreSQL 16 | [![PostgreSQL](https://img.shields.io/badge/postgresql-16-336791?logo=postgresql)](https://www.postgresql.org) |
| Auth | JWT + httpOnly cookie | |
| API docs | @fastify/swagger + Swagger UI | |
| Frontend | Vue 3 + Vite + Vue Router + Pinia | [![Vue.js](https://img.shields.io/badge/vue-3-42b883?logo=vue.js)](https://vuejs.org) |
| UI | Tailwind CSS + shadcn-vue | [![Tailwind](https://img.shields.io/badge/tailwind-3-38bdf8?logo=tailwindcss)](https://tailwindcss.com) |
| i18n | vue-i18n v9 (EN + FR) | |
| HTTP client | ofetch | |
| Backend tests | Vitest + fastify.inject() | [![Vitest](https://img.shields.io/badge/vitest-2-6e9f18?logo=vitest)](https://vitest.dev) |
| Frontend tests | Vitest + Vue Test Utils | |
| E2E tests | Playwright | [![Playwright](https://img.shields.io/badge/playwright-1-2ead33?logo=playwright)](https://playwright.dev) |
| Linting | ESLint + Prettier | |
| Pre-commit | Husky + lint-staged | |
| CI/CD | GitHub Actions | [![GitHub Actions](https://img.shields.io/badge/github%20actions-2088ff?logo=github-actions)](https://github.com/features/actions) |
| Containers | Docker Compose | [![Docker](https://img.shields.io/badge/docker-compose-2496ed?logo=docker)](https://docs.docker.com/compose/) |
| Registry | GitHub Container Registry (GHCR) | |
| Production | VPS + Traefik + Let's Encrypt | |

---

## Roadmap

### V1 — Backend

- [x] BLOCK-01 · Repository & README
- [x] BLOCK-02 · Monorepo & tooling setup
- [x] BLOCK-03 · Docker dev stack
- [x] BLOCK-04 · Database schema & Prisma
- [x] BLOCK-05 · Auth API (register, login, refresh, logout)
- [x] BLOCK-06 · Templates API
- [x] BLOCK-07 · Collections API
- [x] BLOCK-08 · Invitations API
- [x] BLOCK-09 · Puzzles API
- [x] BLOCK-10 · Notes & Attempts API
- [x] BLOCK-11 · GPX import
- [x] BLOCK-12 · CSV import
- [x] BLOCK-13 · Backend quality pass (coverage, JSDoc, Swagger)
- [x] BLOCK-14 · GitHub Actions CI + CD scaffold

### V2 — Frontend

- [x] BLOCK-15 · Vue 3 project setup (routing, Pinia, Tailwind, ofetch)
- [x] BLOCK-16 · Auth UI (login, register)
- [x] BLOCK-17 · Collections UI (list, create, invite)
- [x] BLOCK-18 · Puzzles UI (table, detail, notes, attempts)
- [x] BLOCK-19 · Template builder UI
- [x] BLOCK-20 · Frontend quality pass (coverage, a11y, responsive)
- [x] BLOCK-21 · CI frontend integration + CD finalization

### Post-V2 features

- [x] BLOCK-i18n · FR/EN multilingualism (vue-i18n, language stored per user)
- [x] BLOCK-invitation-email · SMTP invitation emails (Nodemailer, NoopMailer in CI)
- [x] BLOCK-claim-workers · Non-exclusive puzzle claiming (PuzzleWorker join table)
- [x] BLOCK-test-isolation · Dedicated test database (`HiveMind_test` + `DATABASE_URL_TEST`)

### V3 — Quality & Production

- [x] BLOCK-22 · E2E Playwright suite (35 tests, Chromium)
- [x] BLOCK-23 · Production deployment (VPS, Traefik, GHCR, SSH CD)
- [x] BLOCK-24 · Automated PostgreSQL backups (daily cron, 7d + 4w rotation)

---

## About

HiveMind is a portfolio project built to explore and demonstrate full-stack development with a modern Node.js ecosystem: Fastify for a performant and type-safe API, Prisma for ergonomic database access, Vue 3 for a reactive frontend, and GitHub Actions for a production-grade CI/CD pipeline.

The project was designed with real-world use in mind — specifically collaborative geocaching mystery series — but the domain model is intentionally generic enough to apply to any puzzle collection.

---

## License

[MIT](LICENSE) — Jean Ceugniet
