🇬🇧 English | [🇫🇷 Français](roadmap.fr.md)

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
