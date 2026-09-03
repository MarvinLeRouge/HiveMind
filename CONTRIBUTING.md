🇬🇧 English | [🇫🇷 Français](CONTRIBUTING.fr.md)

# Contributing to HiveMind

---

## Prerequisites

- Node.js 20 LTS
- pnpm 9+
- Docker + Docker Compose

---

## Local setup

```bash
git clone https://github.com/MarvinLeRouge/HiveMind.git
cd HiveMind
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
docker compose up -d
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma db seed
```

See [docs/operations.md](docs/operations.md) for full details on the local stack, Docker commands, and production deployment.

---

## Branch naming

| Prefix | When to use |
|--------|-------------|
| `feat/` | New feature |
| `fix/` | Bug fix |
| `chore/` | Tooling, config, dependency update |
| `docs/` | Documentation only |
| `refactor/` | Code restructuring without behavior change |
| `test/` | Test additions or fixes |

Use lowercase kebab-case. Example: `feat/puzzle-checker-url`, `fix/invite-email-encoding`.

---

## Commit format

Follow [Conventional Commits](https://www.conventionalcommits.org/). Every commit must include a `Modified files:` section listing the files touched.

```
<type>(<optional scope>): <short summary in imperative mood, lowercase, no trailing period>

Modified files:
- path/to/file-a.ts — what was changed
- path/to/file-b.vue — what was changed
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`, `perf`, `ci`.

Example:

```
feat(api): add puzzle checker URL validation

Modified files:
- apps/api/src/services/puzzle.service.ts — validate checkerUrl format
- apps/api/tests/unit/puzzle.service.test.ts — add validation tests
```

---

## Code conventions

- **TypeScript strict mode** - no `any`, no `@ts-ignore`
- **Zod schemas** - every Fastify route must have an input and output schema
- **JSDoc** - every exported function, class, and type must have a JSDoc comment
- **Naming** - `camelCase` for variables/functions, `PascalCase` for classes/components, `UPPER_SNAKE_CASE` for constants, `kebab-case` for files
- **No dead code** - do not leave commented-out blocks or unused imports

---

## Testing

Every pull request must:

- Keep backend coverage >= 80% (`pnpm --filter api test:coverage`)
- Keep frontend coverage >= 80% (`pnpm --filter web test:coverage`)
- Add at least one unit test per new service method
- Add at least one integration test per new API endpoint (happy path + 401/403 where applicable)

See [docs/testing.md](docs/testing.md) for test database setup and E2E instructions.

---

## Before opening a pull request

```bash
# Lint and format
pnpm lint

# Backend tests
pnpm --filter api test

# Frontend tests
pnpm --filter web test

# E2E (requires full Docker stack)
pnpm test:e2e
```

The CI workflow runs all of the above automatically on every push.

---

## Pull request checklist

- [ ] Branch follows the naming convention
- [ ] Commits follow Conventional Commits format with `Modified files:` section
- [ ] All tests pass locally
- [ ] New code has test coverage
- [ ] No `.env` files or secrets committed
- [ ] Documentation updated if behavior changed
