# Changelog

All notable changes to HiveMind are documented here.
Generated automatically from Conventional Commits history.

## [Unreleased]

### Bug Fixes

- **web:** Remove non-existent tests dir from eslint pattern
- **web:** Replace test scripts with no-ops until frontend is scaffolded
- Use bcrypt in seed and add env_file to frontend service
- **web:** Use collection slug instead of UUID in list links
- **web:** Use collection slug instead of UUID in list links
- **web:** Seed puzzle UUIDs, add puzzles link, grant admin owner rights
- **dev:** Align local stack with Traefik routing
- **api:** Accept slug IDs on GET /templates/:id
- **web:** Route system template updates to PATCH /templates/system/:id
- **web:** Redirect to new slug after collection rename
- **web:** Use collection slug instead of UUID for navigation
- **api:** Resolve collection slug to UUID before creating invitation
- **api:** Expose resolvedCollectionId from middlewares to avoid slug-as-FK bugs
- **api:** Accept collection slug in puzzleParamsSchema :id param
- **templates:** Add admin delete capability for system and user templates
- **mailer:** Correct boolean env parsing and wire ignoreTLS for Mailpit
- **web:** Restore session before router mounts to prevent spurious logout on reload
- **cd:** Lowercase repository name in GHCR image tags
- **ci:** Strip Docker setup from E2E placeholder to unblock CD pipeline
- **cd:** Include Prisma migrations in production image
- **cd:** Call prisma binary directly to avoid npx OOM kill on migration
- **api:** Create prisma bin wrapper in production image
- **cd:** Run migrations before starting backend to reduce memory pressure
- **docker:** Use pnpm deploy for production image and rename containers
- **cd:** Pass VITE_API_BASE_URL as build arg to frontend image
- **ci:** Run prisma generate before seed in E2E workflow
- **e2e:** Use authenticated ApiClient in beforeAll/afterAll hooks
- **e2e:** Route API through nginx proxy to make frontend+backend same-origin
- **web:** Call GET /auth/me after token refresh to populate user state
- **e2e:** Correct 4 test mismatches against actual API behavior
- **e2e:** Fix 5 more E2E failures after second CI run
- **e2e:** Fix 3 root causes of remaining 8 E2E failures
- **e2e:** Fix strict mode violation in puzzle member test
- **web:** Fix invisible zebra stripes on puzzle list
- **web:** Implement zebra stripes via CSS utility instead of Tailwind opacity modifier
- **web:** Replace all remaining hardcoded Tailwind colors with design tokens
- **web:** Replace bg-slate-100/text-slate-600 with muted tokens on system badge
- **web:** Fix CI test failures introduced by colorize changes
- **web:** Replace crypto.randomUUID with Date.now + Math.random in toast store
- **web:** Remove invalid write to read-only isOwner getter in test
- **api:** Resolve TypeScript strict errors in auth service
- **e2e:** Resolve E2E test failures caused by rate limiting and strict selector
- **api:** Increase hookTimeout and add refreshToken cleanup in invitations test
- **api:** Exclude environment-only rate limit branches from coverage
- **api:** Add missing c8 ignore on refresh route rate limit line
- **web:** Persist access token in localStorage to survive E2E storageState reuse
- **e2e:** Scope invitation confirmation to toast to avoid strict mode violation
- **e2e:** Verify email via Mailpit after register in global-setup
- **e2e:** Update notes tab locator to match current label
- **e2e:** Update register test to match post-verification flow
- **web:** Show localized error message on login with unverified email
- **web:** Propagate backend error messages to all form error displays

### Chores

- Initialize repository
- Add .gitignore
- Remove pre-commit hook test file
- Configure monorepo tooling (TypeScript, ESLint, Prettier, Husky)
- Add Docker dev and prod stacks
- **api:** Backend quality pass — JSDoc, coverage verified
- Add GitHub Actions CI and CD workflows
- Add codecov.yml with per-flag coverage targets
- Set default patch coverage to informational, enforce per-flag
- Make patch coverage informational — enforce project coverage only
- Enrich codecov.yml with ignore patterns and concrete patch target
- Enable frontend CI job, update README coverage metrics
- Enable frontend CI job, update README coverage metrics
- Path-based job filtering, boost frontend coverage 76%→84%
- **web:** Responsive mobile layout pass (BLOCK-20)
- Enable carryforward on codecov flags to preserve coverage on doc-only PRs
- Update gitignore to exclude docs/ai/ folder
- **ci:** Add typecheck step and fix latent TypeScript errors
- **api:** Isolate integration tests on a dedicated test database
- **cd:** Align deployment with VPS conventions
- **ci:** Park E2E gate and trigger CD directly on push to main
- Ignore local AI tooling files
- **web:** Apply ring-2 focus ring to remaining 8 files (WCAG 2.4.11)
- Add .github/PULL_REQUEST_TEMPLATE.md
- Add cliff.toml and generate initial CHANGELOG.md
- Add changelog.yml workflow for automated CHANGELOG.md updates
- Fix changelog workflow - replace orhun/git-cliff-action with npx git-cliff

### Documentation

- Initialize repository with README and project structure
- Update roadmap to reflect completed blocks 02-06
- Switch to shields.io Codecov badges with backend/frontend labels, align coverage figures
- CI frontend verified, README V2 roadmap complete (BLOCK-21)
- Update README and README.fr.md for post-V2 changes
- Fix endpoint count and add missing admin template routes
- Update E2E coverage in READMEs for BLOCK-22 completion
- Fix frontend test description in README (pages, components, stores, utilities)
- Update README and README.fr.md after global review
- **progress:** Mark BLOCK-27 all items done
- Update README and README.fr.md for BLOCK-27 and BLOCK-28
- Add docs/roadmap.md and docs/roadmap.fr.md
- Add docs/architecture.md and docs/architecture.fr.md
- Add docs/api/api_endpoints.md and docs/api/api_endpoints.fr.md
- Add docs/operations.md and docs/operations.fr.md
- Add docs/testing.md and docs/testing.fr.md
- Slim down README and README.fr.md, add Documentation section with links
- Add docs/design-system.md and docs/design-system.fr.md
- Add CONTRIBUTING.md and CONTRIBUTING.fr.md
- Add SECURITY.md and SECURITY.fr.md
- Add CODE_OF_CONDUCT.md and CODE_OF_CONDUCT.fr.md

### Features

- **api:** Add Prisma schema, migration, seed and env validation
- **api:** Implement JWT auth (register, login, refresh, logout, me)
- **api:** Implement Templates API
- **api:** Implement Collections API
- **api:** Implement Invitations API
- **api:** Implement Puzzles API
- **api:** Implement Notes and Attempts API
- **api:** Implement GPX import
- **api:** Implement CSV import
- **web:** Scaffold Vue 3 app with auth, router, Pinia, Tailwind
- **web:** Auth pages (login, register)
- **web:** Collections pages
- **api:** Add slug to collections for readable URLs
- **web:** Puzzles UI — list, detail, notes, attempts (BLOCK-18)
- **web:** Template builder UI — list, create, edit (BLOCK-19)
- **web:** Frontend quality pass — coverage 84%→88%, ARIA labels (BLOCK-20)
- **infra:** Harmonize Traefik configuration
- **templates,puzzles:** Replace boolean field flags with 3-state modes, add puzzle description
- **invitations:** Send invitation email via SMTP after record creation
- **web:** Add invitation acceptance page
- **web:** Merge puzzle list into collection page with collapsible members panel
- **i18n:** Add FR/EN multilingualism with per-user language preference
- **claim-workers:** Replace exclusive claim with non-exclusive PuzzleWorker join table
- **e2e:** Implement full Playwright E2E test suite (BLOCK-22)
- **web:** Replace shadcn default palette with HiveMind olive identity (OKLCH)
- **web:** Switch palette from olive to teal (oklch hue 200)
- **web:** Improve navbar hover states, language pill, and puzzle list zebra
- **web:** Add dark/light mode toggle with OS preference detection
- **web:** Replace collections card grid with structured list
- **web:** Enforce 44px touch targets on coarse-pointer devices (WCAG 2.5.5)
- **web:** Improve loading and empty states (onboard)
- **web:** Add toast notifications, dynamic page titles, and fix hardcoded strings
- **web:** Add AppErrorBanner component and graceful error states
- **web:** Add mobile-responsive layout for nav and key pages
- **web:** Add micro-interactions (button press, focus ring, tab indicator, content enter)
- **api:** Implement security hardening (BLOCK-25)
- **web:** Replace hardcoded strings with i18n keys across frontend
- **web:** Impeccable polish, colorize, and adapt pass for BLOCK-27
- **auth:** Add email verification on register

### Refactoring

- **web:** Use .zebra on collections list for consistency with puzzle list

### Tests

- Verify pre-commit hook
- **web:** Add unit tests for collection page components
- **web:** Branch coverage pass — 85%→87% branches, 140 tests
- **api:** Update remaining test fixtures to use 3-state field modes
- **invitations:** Add unit tests for NodemailerMailerService and InvitationPage
- **web:** Add missing language field to mock User objects in unit tests
- **web:** Improve coverage for i18n additions
- **web:** Improve patch coverage for claim-workers feature
- **web:** Cover puzzle edit submit button label
- **web:** Add dark mode toggle coverage to TheNavbar tests
- **web:** Add empty state coverage for TemplatesPage
- **web:** Add missing coverage for AppToast, TemplatesPage, CollectionDetailPage, PuzzleDetailPage
- **web:** Add missing coverage for error handlers and retry paths
- **web:** Cover loginFailed fallback and template-driven puzzle fields
- **web:** Cover moveUp and moveDown keyboard reorder in PuzzlesPage and CollectionDetailPage


