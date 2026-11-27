[🇫🇷 Version française](roadmap.fr.md) | 🇬🇧 English version

# HiveMind - Roadmap

[← Back to README](../README.md)

---

### V1 - Backend

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

### V2 - Frontend

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

### V3 - Quality & Production

- [x] BLOCK-22 · E2E Playwright suite (35 tests, Chromium)
- [x] BLOCK-23 · Production deployment (VPS, Traefik, GHCR, SSH CD)
- [x] BLOCK-24 · Automated PostgreSQL backups (daily cron, 7d + 4w rotation)
- [x] BLOCK-25 · Security hardening (OWASP Top 10 audit, Helmet/CSP, rate limiting, server-side JWT invalidation, CVE patching)
- [x] BLOCK-26 · Design polish (accessible OKLCH palette, dark mode, mobile-responsive layout, empty states, error boundaries, micro-interactions)
- [x] BLOCK-27 · Design audit (impeccable - score 14/20, OKLCH semantic tokens, WCAG ring-2 focus, keyboard drag-and-drop, accessible motion)
- [x] BLOCK-28 · Email verification on register (SHA-256 token, Brevo SMTP, /verify-email page, resend flow)

## Section 5 - Maintenance

- [x] FIX-001 - Patch fast-jwt advisories (critical algorithm confusion, unsigned JWT and claim bypasses)
- [x] FIX-002 - Patch high-severity advisories (vue-i18n XSS, Vue SSR XSS, zod, busboy and source-map-js DoS, vite)
- [x] FIX-003 - Patch moderate and low advisories (fast-uri, glob, vitest, fastify, fast-xml-parser, csv-parse, postcss-selector-parser)
- [x] CI-001 - Run CI on the changelog bot PR so its auto-merge can complete
- [x] FIX-004 - Drop upgrade-insecure-requests from the API CSP (blank local Swagger UI)
- [x] CHORE-001 - Add Dependabot config (npm, docker, github-actions)
- [x] CHORE-002 - Upgrade vitest and @vitest/coverage-v8 to 5
- [x] TEST-001 - Close per-file coverage gaps (all api and web files at 80% or more, dead code removed)
- [x] CHORE-004 - Load a local test env file for api tests and refuse non-test databases
- [x] CHORE-003 - Migrate to Prisma 7 (prisma.config.ts, driver adapter; Dependabot PR #145)
- [x] CHORE-005 - Load prod config only from shared/env (backend loads secrets.env), drop compose/.env interpolation
- [x] FIX-005 - Deploy the images tagged with the commit SHA instead of `latest` (`IMAGE_TAG` was never set)
- [x] CHORE-006 - Align the Node runtime on 26 LTS (CI, Docker images, engines, @types/node, docs)
- [x] CHORE-007 - Ignore Prisma majors in Dependabot until the Prisma 7 migration (CHORE-003)
- [x] FIX-006 - Patch the effect ReDoS advisory (high, pulled by Prisma 6 @prisma/config)
- [x] CI-002 - Move every GitHub Action to its current major pinned by commit SHA, changelog workflow on Node 26, single Dependabot actions group
- [x] CI-003 - Rename the deploy workflow to build-push-deploy.yml, two explicit jobs (Build & push, Deploy), no functional change
- [x] CHORE-008 - Update the frontend toolchain: TypeScript 6.0, Vite 8, Vue Router 5, vue-tsc 3, ESLint 10 with eslint-plugin-vue 10
- [x] CI-004 - Raise the coverage floor from 80% to 85% (gates and docs)
- [x] CI-005 - Scan staged changes for secrets with gitleaks in the pre-commit hook
- [x] CI-006 - Run one deploy at a time (concurrency group), so close merges no longer remove each other's containers
- [x] CHORE-009 - Ignore the build output of every workspace package (`dist/`), not only the two apps
- [x] DOCS-001 - Write the product context (generic collaborative puzzle-solving platform)
- [x] CHORE-010 - Migrate to Tailwind CSS 4 and tailwind-merge 3 (supersedes Dependabot #157 and #156)
