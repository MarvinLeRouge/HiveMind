[🇫🇷 Version française](testing.fr.md) | 🇬🇧 English version

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

Integration tests run against `HiveMind_test`, a dedicated database in the dev stack container (`hivemind-db-1`, published on `127.0.0.1:5434`). Create it once if it does not exist:

```bash
docker compose exec db createdb -U HiveMind HiveMind_test
```

Then create the local test environment file from its template and set the database password:

```bash
cp apps/api/.env.test.example apps/api/.env.test
```

`vitest.config.ts` loads `apps/api/.env.test` when it exists, so `pnpm --filter api test:coverage` works as is from the host. Variables already set in the shell take precedence over the file. The test global setup applies migrations and seed to `DATABASE_URL_TEST` before the suite runs.

Outside CI, the global setup refuses to run unless the target database name ends with `_test`, so a misconfigured file cannot wipe the dev database. In CI, there is no `.env.test` and no `DATABASE_URL_TEST`: the workflow sets the variables and the CI PostgreSQL service is used directly via `DATABASE_URL`.

---

## Frontend

```bash
pnpm --filter web test              # Run all tests
pnpm --filter web test:coverage     # With coverage report (target >= 80%)
```

- JSDOM environment, Vue Test Utils
- 29 test files covering pages (12), components including the `App` root (6), Pinia stores (7), the router and composables (2), and utilities (2)

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
