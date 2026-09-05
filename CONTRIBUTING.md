[🇫🇷 Version française](CONTRIBUTING.fr.md) | 🇬🇧 English version

---

# Contributing to HiveMind

## Prerequisites

- Node.js 20 LTS
- pnpm 9+
- Docker + Docker Compose

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

## Running tests

```bash
pnpm --filter api test          # backend unit + integration tests
pnpm --filter web test          # frontend tests
pnpm test:e2e                   # E2E, requires the full Docker stack
```

Every pull request must keep backend and frontend coverage at 80% or above (`pnpm --filter api test:coverage`, `pnpm --filter web test:coverage`). See [docs/testing.md](docs/testing.md) for test database setup and E2E instructions.

## Workflow

1. Fork the repository and create a branch off `main`.
2. Make your change, with tests covering it.
3. Commit following the convention below.
4. Push and open a pull request against `main`.
5. CI must pass before review.

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

## Commit convention

Follow [Conventional Commits](https://www.conventionalcommits.org/), imperative mood, lowercase summary, no trailing period, with a mandatory `Modified files:` section:

```
<type>(<optional scope>): <short summary>

Modified files:
- path/to/file-a.ts - what was changed
- path/to/file-b.vue - what was changed
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`, `perf`, `ci`.

Example:

```
feat(api): add puzzle checker URL validation

Modified files:
- apps/api/src/services/puzzle.service.ts - validate checkerUrl format
- apps/api/tests/unit/puzzle.service.test.ts - add validation tests
```

## Code style

- **TypeScript strict mode** - no `any`, no `@ts-ignore`
- **Zod schemas** - every Fastify route must have an input and output schema
- **JSDoc** - every exported function, class, and type must have a JSDoc comment
- **Naming** - `camelCase` for variables/functions, `PascalCase` for classes/components, `UPPER_SNAKE_CASE` for constants, `kebab-case` for files
- **No dead code** - do not leave commented-out blocks or unused imports

CI will reject any pull request that fails these checks.

## Code of Conduct

This project follows a [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold it.

## License

By contributing, you agree that your contributions will be licensed under the project's license (see [LICENSE](LICENSE)).

---

## Before opening a pull request

```bash
pnpm lint                       # lint and format
pnpm --filter api test          # backend tests
pnpm --filter web test          # frontend tests
pnpm test:e2e                   # E2E, requires the full Docker stack
```

The CI workflow runs all of the above automatically on every push.

## Pull request checklist

- [ ] Branch follows the naming convention
- [ ] Commits follow Conventional Commits format with `Modified files:` section
- [ ] All tests pass locally
- [ ] New code has test coverage
- [ ] No `.env` files or secrets committed
- [ ] Documentation updated if behavior changed
