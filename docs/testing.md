🇬🇧 English | [🇫🇷 Français](testing.fr.md)

# HiveMind - Testing

[← Back to README](../README.md)

---

## Backend

```bash
pnpm --filter api test              # Run all tests
pnpm --filter api test:coverage     # With coverage report (target >= 80%)
```

- **Unit tests** - `apps/api/tests/unit/` - service logic, repositories mocked
- **Integration tests** - `apps/api/tests/integration/` - real Fastify instance via `fastify.inject()`
- Every endpoint is tested for the happy path + 401/403/404 scenarios
- Integration tests run against a dedicated test database to protect the dev database

### Test database setup (local)

Integration tests require a separate PostgreSQL database. Create it once:

```bash
createdb HiveMind_test
```

Then add the connection string to `apps/api/.env`:

```env
DATABASE_URL_TEST=postgresql://postgres@localhost:5432/HiveMind_test
```

When `DATABASE_URL_TEST` is set, the test global setup applies migrations and seed to that database before the suite runs. In CI, there is no `DATABASE_URL_TEST` - the CI PostgreSQL service is used directly via `DATABASE_URL`.

---

## Frontend

```bash
pnpm --filter web test              # Run all tests
pnpm --filter web test:coverage     # With coverage report (target >= 80%)
```

- JSDOM environment, Vue Test Utils
- 26 test files covering pages (12), reusable components (5), Pinia stores (7), and utilities (2)

---

## E2E - Playwright

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

## Coverage targets

| Package | Target | Actual |
|---------|--------|--------|
| Backend | >= 80% | >= 97% |
| Frontend | >= 80% | >= 92% |

Coverage is uploaded to Codecov on every CI run. Badges are visible in the README.
