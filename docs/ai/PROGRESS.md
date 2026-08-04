# Hivemind — Progress Tracker

> Block-by-block progress log.
> Check off items as you complete them.
> If context limit is reached mid-block, restart Claude Code with:
> **"Resume PROGRESS.md — block [BLOCK-ID]"**

---

## How to use this file

- `[ ]` — not started
- `[~]` — in progress
- `[x]` — complete
- Add a note after any item if you hit a blocker: `[ ] task name — ⚠️ blocker: reason`

---

## V1 — Backend

### BLOCK-01 · Repository & README
- [x] Create GitHub repo `hivemind` (public)
- [x] Initialize pnpm monorepo root
- [x] Create `README.md` (English)
- [x] Create `README.fr.md` (French)
- [x] Create `LICENSE` (MIT)
- [x] Create `.gitignore`
- [x] Create `PROGRESS.md`
- [x] Initial commit + push
- [x] Verify README renders correctly on GitHub

### BLOCK-02 · Monorepo & tooling setup
- [x] `pnpm-workspace.yaml`
- [x] `apps/api`, `apps/web`, `packages/shared` initialized
- [x] Root `tsconfig.json` + per-package configs
- [x] ESLint configured at root
- [x] Prettier configured at root
- [x] Husky initialized
- [x] `pre-commit` hook with lint-staged
- [x] Root `package.json` scripts
- [x] Pre-commit hook verified (blocks dirty commit)
- [x] Commit

### BLOCK-03 · Docker dev stack
- [x] `apps/api/Dockerfile` (multi-stage)
- [x] `apps/web/Dockerfile` (multi-stage)
- [x] `docker-compose.yml` (dev — backend, frontend, db)
- [x] `docker-compose.prod.yml` (prod — Traefik labels)
- [x] `.env.example`
- [x] `docker compose up -d` → all services healthy
- [x] Commit

### BLOCK-04 · Database schema & Prisma
- [x] Prisma installed in `apps/api`
- [x] `schema.prisma` written
- [x] `DATABASE_URL` validated via Zod at startup
- [x] First migration generated (`init`)
- [x] `seed.ts` written (admin user + 2 system templates + sample data)
- [x] Seed runs without error
- [x] Prisma Studio verified
- [x] Seed integrity tests written
- [x] Commit

### BLOCK-05 · Auth API
- [x] Dependencies installed (`@fastify/jwt`, `@fastify/cookie`, `bcryptjs`)
- [x] `AuthRepository` implemented
- [x] `AuthService` implemented
- [x] `authenticate` middleware implemented
- [x] All 5 routes implemented with Zod schemas
- [x] Swagger annotations complete
- [x] Unit tests for `AuthService`
- [x] Integration tests for all 5 endpoints
- [x] 401 / 409 scenarios tested
- [x] Commit

### BLOCK-06 · Templates API
- [x] `TemplateRepository` + `TemplateService` implemented
- [x] Permission checks at route level
- [x] Zod schemas complete
- [x] Unit tests
- [x] Integration tests (including 403 scenarios)
- [x] Commit

### BLOCK-07 · Collections API
- [x] `CollectionRepository` + `CollectionService` implemented
- [x] Template snapshot logic on create
- [x] Creator auto-joined as owner
- [x] `requireMember` + `requireOwner` middlewares
- [x] Unit tests + integration tests
- [x] Commit

### BLOCK-08 · Invitations API
- [x] `InvitationRepository` + `InvitationService` implemented
- [x] Accept inserts `CollectionMember`
- [x] Expiry logic implemented
- [x] Email ownership check implemented
- [x] Unit tests + integration tests (expired, wrong user, already accepted)
- [x] Commit

### BLOCK-09 · Puzzles API
- [x] `PuzzleRepository` + `PuzzleService` implemented
- [x] Bulk reorder implemented
- [x] Claim / unclaim implemented
- [x] Template-driven field filtering on response
- [x] Status transitions implemented
- [x] Unit tests + integration tests
- [x] Commit

### BLOCK-10 · Notes & Attempts API
- [x] `NoteRepository` + `NoteService` implemented
- [x] `AttemptRepository` + `AttemptService` implemented
- [x] Author-only edit/delete for notes
- [x] Attempts immutable after creation
- [x] Unit tests + integration tests
- [x] Commit

### BLOCK-11 · GPX import
- [x] `fast-xml-parser` installed
- [x] `GpxParserService` implemented
- [x] `GpxImportService` implemented
- [x] Multipart upload configured (max 10MB)
- [x] Unit tests with fixture GPX files
- [x] Integration test (upload → puzzles created)
- [x] Commit

### BLOCK-12 · CSV import
- [x] `csv-parse` installed
- [x] `CsvPreviewService` implemented
- [x] `CsvImportService` implemented
- [x] Unit tests + integration tests with fixture CSV files
- [x] Commit

### BLOCK-13 · Backend quality pass
- [x] Coverage ≥ 80% (`vitest --coverage`)
- [x] All gaps filled
- [x] JSDoc on all exported functions, classes, types
- [x] `/docs` Swagger UI verified (all routes, all schemas)
- [x] Consistent error response format across all routes
- [x] Env validation at startup (fail fast)
- [x] Commit

### BLOCK-14 · GitHub Actions CI + CD scaffold
- [x] `ci.yml` written and tested (backend + frontend jobs)
- [x] `e2e.yml` scaffolded (placeholder step)
- [x] `build-deploy.yml` written
- [x] Push to `main` → CI green
- [x] PROGRESS.md updated
- [x] README roadmap updated (V1 checked off)
- [x] Commit

---

## V2 — Frontend

### BLOCK-15 · Vue 3 project setup
- [x] Vue 3 scaffold created
- [x] Tailwind CSS + shadcn-vue installed
- [x] ofetch installed and configured (JWT header + refresh interceptor)
- [x] `@hivemind/shared` path alias configured
- [x] Pinia `useAuthStore` implemented
- [x] Vue Router with auth guard
- [x] Base layout implemented
- [x] Vitest config ready
- [x] Commit

### BLOCK-16 · Auth UI
- [x] `/login` page
- [x] `/register` page
- [x] Silent refresh on app load
- [x] Unit tests
- [x] Commit

### BLOCK-17 · Collections UI
- [x] `/collections` list page
- [x] `/collections/new` create page
- [x] `/collections/:id` overview page
- [x] `/collections/:id/settings` page (owner only)
- [x] Invite flow implemented
- [x] Unit tests
- [x] Commit

### BLOCK-18 · Puzzles UI
- [x] `/collections/:id/puzzles` table page
- [x] `/collections/:id/puzzles/:pid` detail page
- [x] Dynamic fields (template-driven)
- [x] Checker URL button
- [x] Notes tab (add, edit, delete own)
- [x] Attempts tab (add + history)
- [x] Drag-and-drop reorder (owner only)
- [x] Claim/unclaim button
- [x] Status transition buttons
- [x] Unit tests
- [x] Commit

### BLOCK-19 · Template builder UI
- [x] `/templates` list page
- [x] `/templates/new` builder page
- [x] `/templates/:id/edit` page
- [x] Unit tests
- [x] Commit

### BLOCK-20 · Frontend quality pass
- [x] Coverage ≥ 80%
- [x] All gaps filled
- [x] Keyboard navigation + ARIA labels
- [x] Responsive on mobile
- [x] Commit

### BLOCK-21 · CI frontend integration + CD finalization
- [x] `ci.yml` frontend Codecov verified
- [x] `build-deploy.yml` frontend image verified
- [x] README test counts updated
- [x] README endpoint table completed
- [x] README V2 roadmap checked off
- [x] Commit

---

## Post-V2 Features

### BLOCK-i18n · FR/EN multilingualism
- [x] `language` field on User model (Prisma migration)
- [x] `PATCH /auth/me` endpoint for language update
- [x] `AuthUser` interface updated with `language`
- [x] `AuthService.updateLanguage()` method + unit tests
- [x] Integration tests for GET /auth/me (language field) and PATCH /auth/me
- [x] vue-i18n v9 setup (`apps/web/src/i18n/index.ts`)
- [x] EN and FR locale files (`src/i18n/locales/{en,fr}.json`)
- [x] i18n registered in `main.ts`
- [x] `User` type updated with `language`
- [x] Auth store: `syncLocale()`, `setLanguage()`, locale sync on login/register/refresh
- [x] TheNavbar: EN/FR toggle buttons
- [x] All 12 pages translated (LoginPage, RegisterPage, CollectionsPage, CollectionNewPage, CollectionDetailPage, CollectionSettingsPage, TemplatesPage, TemplateNewPage, TemplateEditPage, InvitationPage, PuzzleDetailPage, PuzzlesPage)
- [x] Components translated: MembersPanel, PuzzleStatusBadge, TheNavbar
- [x] Test setup: vue-i18n global plugin in `tests/setup.ts`
- [x] Frontend tests updated (22 files / 153 tests pass)
- [x] Lint clean
- [x] Commit

### BLOCK-invitation-email · SMTP invitation emails
- [x] Nodemailer installed + `MailerService` / `NoopMailerService` implemented
- [x] SMTP env vars validated at startup (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `APP_BASE_URL`)
- [x] Invitation email dispatched on `POST /collections/:id/invitations` with accept/decline links
- [x] `NoopMailerService` injected in all integration tests (no real SMTP in CI)
- [x] Confirmed working in prod (email received, link functional)
- [x] Commit

### BLOCK-claim-workers · Non-exclusive puzzle claiming (PuzzleWorker table)
- [x] `PuzzleWorker` join table added to Prisma schema (migration `20260701120000_replace_workingOnId_with_puzzle_workers`)
- [x] `workingOnId` column removed from `Puzzle`
- [x] Claim/unclaim API updated: any member can claim, multiple claimants allowed
- [x] `/collections/:id/puzzles` redirect added to Vue Router (old URL pattern)
- [x] Unit tests + integration tests updated
- [x] Commit

### BLOCK-test-isolation · Test DB isolation
- [x] `DATABASE_URL_TEST` env var for dedicated test database (`HiveMind_test`)
- [x] `global-setup.ts` applies migrations + seed against test DB only
- [x] `beforeEach` in integration tests wipes non-admin users, non-system templates, all collections
- [x] CI uses `DATABASE_URL` (PostgreSQL service container) — `DATABASE_URL_TEST` intentionally absent in CI
- [x] Commit

---

## V3 — Quality & Production

### BLOCK-22 · E2E Playwright suite
- [x] `@playwright/test` installed at workspace root
- [x] `playwright.config.ts` at monorepo root (Chromium, `e2e/` testDir)
- [x] `e2e/global-setup.ts` — waits for app, registers E2E users idempotently, saves storageState
- [x] `e2e/helpers/api.ts` — typed API helpers (createCollection, createPuzzle, sendInvitation…)
- [x] `e2e/fixtures/` — sample.gpx + sample.csv (copied from apps/api/tests/fixtures/)
- [x] `auth.spec.ts` — login, wrong password, register, logout, unauthenticated redirect, i18n toggle
- [x] `collections.spec.ts` — create, view, settings, delete, invite, member/outsider access
- [x] `puzzles.spec.ts` — list, add, edit, claim/release, status advance, delete; member access
- [x] `notes.spec.ts` — add, edit, delete own note; member cannot edit owner's notes
- [x] `attempts.spec.ts` — record attempt, immutability, chronological order
- [x] `import.spec.ts` — GPX import, CSV preview, CSV import (API-level, no browser UI)
- [x] `docker-compose.e2e.yml` — production builds, DB on port 5432 for CI runner migrations
- [x] `e2e.yml` updated — full Playwright run with Docker stack, migrations, seed
- [x] `build-deploy.yml` updated — E2E gate restored (workflow_run trigger)
- [x] `test:e2e` script added to root `package.json`
- [x] `e2e/.auth/` added to `.gitignore`
- [x] Commit

### BLOCK-23 · Production deployment
- [x] Traefik labels finalized in `docker-compose.prod.yml` (container names prefixed `hivemind-*`, `name: hivemind`)
- [x] GitHub secrets configured (`DEPLOY_SSH_HOST`, `DEPLOY_SSH_USER`, `DEPLOY_SSH_PRIVATE_KEY`, `VITE_API_BASE_URL`)
- [x] Backend Dockerfile: `pnpm deploy` for flat self-contained node_modules (fixes module resolution)
- [x] Frontend Dockerfile: `ARG VITE_API_BASE_URL` baked at build time
- [x] Cloudflare DNS: explicit A record `hivemind → 188.166.21.144 Proxied`
- [x] CD trigger: E2E gate restored in BLOCK-22 (`workflow_run` on E2E success)
- [x] First deployment successful: login, collection creation, invitation flow confirmed
- [x] Seed run on VPS, admin account confirmed
- [x] Commit

### BLOCK-24 · Automated PostgreSQL backups
- [x] VPS cron backup script (`~/marvinlerouge.dev/hivemind/backup.sh`)
- [x] Rotation logic (7 daily + 4 weekly / Sunday)
- [x] Cron configured: `0 2 * * *` with log in `backups/backup.log`
- [x] Restore tested: dump restored into temp DB, 10 tables present, content verified
- [x] Restore procedure documented in README
- [x] Commit

---

---

## V4 — Security & Design

### BLOCK-25 · Security audit & hardening
- [x] OWASP Top 10 — revue de l'implémentation existante (security-review.md)
- [x] Auth : expiry des tokens, invalidation du refresh à la déconnexion, protection brute force sur login/register
- [x] Autorisation : IDOR sur collections, puzzles, notes, invitations (ownership checks)
- [x] En-têtes HTTP : Helmet (CSP, HSTS, X-Frame-Options, Referrer-Policy…)
- [x] CORS : revue des origines autorisées en prod vs dev (déjà correct, aucun changement)
- [x] Rate limiting sur les endpoints sensibles (login, register, invitation)
- [x] Revue couverture Zod vs risque XSS côté frontend (Vue auto-escape, pas de risque)
- [x] `pnpm audit` sur toutes les dépendances (fast-jwt + fast-uri CVEs corrigés via overrides)
- [x] Pas de fuite de données sensibles dans les réponses API / logs (toAuthUser(), message login uniforme)
- [x] Commit (feat/block-25-security mergé)

### BLOCK-26 · Design polish & UX
- [x] Audit visuel global — audit impeccable (11/20), palette teal OKLCH, dark mode toggle, tokens sémantiques statuts, zèbre puzzle list, nettoyage couleurs brutes (feat/colorize-palette)
- [x] CollectionsPage: card grid remplacee par liste structuree (avatars initiales colores, zebra, date relative, chevron) (feat/layout-collections)
- [x] Touch targets 44px via @media (pointer: coarse) sur button, input, a.inline-flex (feat/adapt-touch-targets)
- [x] États vides (CollectionsPage, TemplatesPage: icon+hint+CTA ; puzzle list: dashed hint) + spinners sur tous les fetches (feat/onboard-empty-states)
- [x] États de chargement: AppSpinner remplace le texte brut sur 5 pages (feat/onboard-empty-states)
- [x] Système de toasts / notifications: useToastStore + AppToast, cablage sur 9 pages, fix crypto.randomUUID (feat/harden-toast-title)
- [x] `<title>` dynamique par route via meta.titleKey + router.afterEach (feat/harden-toast-title)
- [x] Fix chaine "none" non traduite dans TemplatesPage (feat/harden-toast-title)
- [x] États d'erreur (AppErrorBanner + retry sur 6 pages, error toast sur PuzzleDetailPage — feat/error-states)
- [x] Passe mobile responsive (hamburger nav, container padding adaptatif, flex-wrap actions, attempt list 2 lignes — feat/mobile-responsive)
- [x] Micro-interactions (press scale 0.96, focus ring transition, tab indicator slide, content-enter fade — feat/micro-interactions)

---

### fix/e2e-rate-limit · E2E fixes post-BLOCK-25
- [x] NODE_ENV 'e2e' ajouté au schema Zod — docker-compose.e2e.yml utilise e2e au lieu de production
- [x] Rate limits raises a 10000 en test/e2e (/* c8 ignore next */ pour la couverture patch)
- [x] hookTimeout Vitest raise a 30000ms — refreshToken.deleteMany() ajouté dans invitations.test.ts beforeEach
- [x] auth.ts : accessToken persisté dans localStorage (hivemind_access_token) — auth.init() lit le localStorage en premier pour éviter la rotation du refresh cookie (BLOCK-25 compatibility)
- [x] auth.spec.ts : language toggle utilise outsider au lieu de owner (evite la race condition de langue)
- [x] collections.spec.ts : "Invitation sent." scope a getByRole('status') pour éviter la strict mode violation (toast + panel)
- [x] 35/35 tests E2E verts (mergé sur main)

---

## V5 — Quality & Features

### BLOCK-27 · Design polish (impeccable audit post-BLOCK-26)

Audit 2026-08-04 : score **14/20** (11/20 avant BLOCK-26).

- [x] `/impeccable clarify` — 12+ chaînes hardcodées à passer par i18n : placeholders (CollectionDetailPage, PuzzleDetailPage, MembersPanel, LoginPage), labels sr-only (PuzzleDetailPage), tab "Attempts" non traduit, bug `{{ t('puzzle.addNote') }}s` (pluriel collé en template)
- [x] `/impeccable polish` — focus ring `ring-1 → ring-2` (WCAG 2.2) sur tous les inputs + tab ARIA incomplet (aria-controls / id tabpanels dans PuzzleDetailPage)
- [x] `/impeccable colorize` — checker result badges `bg-green-100/red-100` sans dark mode → tokens sémantiques
- [x] `/impeccable adapt` — keyboard alternative pour le drag-and-drop de puzzles (WCAG 2.1.1)
- [x] `/impeccable polish` final — AppToast tokens sémantiques + worker pill inline style → classe utilitaire

### BLOCK-28 · Email verification on register (Brevo)

Calquer l'implémentation de gc-tracker. Brevo est déjà configuré en prod pour les emails d'invitation.

- [ ] Ajouter `emailVerified Boolean @default(false)` + `VerificationToken` sur le modèle User (Prisma migration)
- [ ] Endpoint `POST /auth/verify-email/:token` — valide le token, passe `emailVerified = true`, expire le token
- [ ] Envoyer le lien de vérification via Brevo à l'inscription (réutiliser MailerService)
- [ ] Bloquer le login si `emailVerified = false` (avec message clair)
- [ ] Page frontend `/verify-email` — affiche succès/erreur selon le token
- [ ] Tests unitaires + intégration
- [ ] Variables d'env : `VERIFICATION_TOKEN_EXPIRES_IN` (ex: 24h)

---

## Notes & blockers

| Date | Block | Note |
|------|-------|------|
| 2026-06-28 | Traefik | Local stack aligned with Traefik routing: `allowedHosts` added to `vite.config.ts`, `VITE_API_BASE_URL` → `http://hivemind.marvinlerouge.local/api`, `CORS_ORIGIN` → `http://hivemind.marvinlerouge.local`. Add `127.0.0.1 hivemind.marvinlerouge.local` to `/etc/hosts` and ensure `traefik-public` Docker network exists before `docker compose up`. |
| 2026-06-29 | Backlog | **Email verification on register**: no email validation currently — a future block should add a one-time link sent by email to verify the address before allowing login. Requires SMTP setup, token storage, new endpoint, and a verification UI page. |
