[🇫🇷 Version française](README.fr.md) | 🇬🇧 English version

# HiveMind

> A collaborative platform for solving puzzle collections asynchronously.

[![Status](https://img.shields.io/badge/status-production-brightgreen)](https://github.com/MarvinLeRouge/HiveMind)
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

Puzzle collections are hard to solve alone. HiveMind makes it simple for a team to tackle them together - tracking who is working on what, recording notes and tested solutions, and progressing toward a final answer.

The domain is intentionally generic: geocaching mystery series, CTF challenges, escape room puzzles, treasure hunts, logic puzzle sets - any collection of enigmas that benefits from collaborative tracking.

Each **Collection** contains **Puzzles**. Each puzzle can carry free-text **Notes** (observations, hypotheses) and **Attempts** (concrete values tested against an optional verification URL). A flexible **Template** system lets each collection expose only the fields that matter for its puzzle type.

---

## Key figures

| Metric | Value |
|--------|-------|
| API endpoints | 43 (auth, templates, collections, invitations, puzzles, notes, attempts, import) |
| Backend test coverage | >= 97 % |
| Frontend test coverage | >= 92 % |
| Languages | EN, FR (per-user preference) |
| E2E tests | 35 (auth, collections, puzzles, notes, attempts, import) |

---

## Features

- **Collections** - create and name a puzzle collection, configure which fields are active
- **Puzzles** - add puzzles with optional metadata: coordinates, difficulty/terrain ratings, hint, spoiler, custom fields
- **Notes** - per-author, timestamped free-text observations on each puzzle
- **Attempts** - immutable records of values tested, with pass/fail result and optional comment
- **Checker URL** - attach an external verification link to a puzzle; attempted values can be checked directly
- **Templates** - define which fields are active on puzzles; system templates provided out of the box (`generic`, `geocaching`)
- **Collaboration** - invite members by email; invitees receive an email with direct accept/decline links
- **Non-exclusive claiming** - any member can mark themselves as working on a puzzle; multiple members can claim the same puzzle simultaneously
- **Roles** - `owner` and `member` roles per collection; platform admins manage system templates
- **Multilingual UI** - EN/FR interface; language preference stored per user and synced across sessions
- **GPX import** - upload a Geocaching pocket query to auto-populate puzzles with coordinates, difficulty, terrain, and GC codes
- **CSV import** - upload a spreadsheet with flexible column-to-field mapping
- **Email verification** - account activation required before first login; verification link sent via Brevo SMTP
- **JWT auth** - access token (15 min) + httpOnly refresh cookie (7 days)
- **Swagger UI** - auto-generated interactive API documentation at `/docs` (development only; disabled in production)

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
| Backend tests | Vitest + fastify.inject() | [![Vitest](https://img.shields.io/badge/vitest-3-6e9f18?logo=vitest)](https://vitest.dev) |
| Frontend tests | Vitest + Vue Test Utils | |
| E2E tests | Playwright | [![Playwright](https://img.shields.io/badge/playwright-1-2ead33?logo=playwright)](https://playwright.dev) |
| Linting | ESLint + Prettier | |
| Pre-commit | Husky + lint-staged | |
| CI/CD | GitHub Actions | [![GitHub Actions](https://img.shields.io/badge/github%20actions-2088ff?logo=github-actions)](https://github.com/features/actions) |
| Containers | Docker Compose | [![Docker](https://img.shields.io/badge/docker-compose-2496ed?logo=docker)](https://docs.docker.com/compose/) |
| Registry | GitHub Container Registry (GHCR) | |
| Production | VPS + Traefik + Let's Encrypt | |

---

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/architecture.md) | Repository layout, backend layers, frontend structure, roles |
| [API endpoints](docs/api/api_endpoints.md) | Full endpoint reference, grouped by domain |
| [Testing](docs/testing.md) | Backend, frontend and E2E test setup and commands |
| [Operations](docs/operations.md) | Local setup, Docker, CI/CD pipeline, deployment, backup |
| [Roadmap](docs/roadmap.md) | Completed blocks from V1 to V3 |
| [Design system](docs/design-system.md) | OKLCH tokens, dark mode, accessibility patterns |
| [Contributing](CONTRIBUTING.md) | How to contribute, branch and commit conventions |
| [Security](SECURITY.md) | Vulnerability disclosure and security measures |
| [Changelog](CHANGELOG.md) | Auto-generated from Conventional Commits history |

---

## About

HiveMind is a portfolio project built to explore and demonstrate full-stack development with a modern Node.js ecosystem: Fastify for a performant and type-safe API, Prisma for ergonomic database access, Vue 3 for a reactive frontend, and GitHub Actions for a production-grade CI/CD pipeline.

Security was treated as a first-class concern: the codebase went through an OWASP Top 10 audit covering HTTP security headers (Helmet, CSP), rate limiting on sensitive endpoints, server-side refresh token invalidation, and targeted CVE patching across transitive dependencies. Email verification is enforced at registration to prevent account enumeration and reduce abuse vectors.

Design quality went through two passes: a polish sprint (BLOCK-26) focused on an accessible OKLCH palette, dark mode, and mobile layout; then a formal audit with the impeccable framework (BLOCK-27, score 14/20) which produced semantic color tokens, WCAG-compliant focus rings, keyboard-accessible drag-and-drop, and prefers-reduced-motion support.

The project was designed with real-world use in mind - specifically collaborative geocaching mystery series - but the domain model is intentionally generic enough to apply to any puzzle collection.

---

## License

[MIT](LICENSE) - Jean Ceugniet
