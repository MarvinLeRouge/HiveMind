[🇫🇷 Version française](backend_developer_guide.fr.md) | 🇬🇧 English version

---

# Backend developer guide

This guide covers day-to-day backend development conventions. See
[docs/architecture.md](../architecture.md) for the layer map and roles/permissions
model, and [docs/api/api_endpoints.md](../api/api_endpoints.md) for the full route
reference.

## Getting started

```bash
docker compose up -d           # Full dev stack (backend · frontend · db)
pnpm --filter api dev          # Or run the backend alone, with hot reload
npx prisma migrate dev
npx prisma db seed
```

See [docs/operations.md](../operations.md) for the Docker Compose details.

## Layered architecture

Controllers are thin: all business logic lives in services. Repositories handle
all Prisma calls and expose no business logic.

```
apps/api/src/
├── routes/        # Route definitions + Zod schemas (input + output)
├── controllers/   # Request/response handling - delegates to services
├── services/      # Business logic - no Prisma calls here
├── repositories/  # Prisma data access - no business logic here
├── middlewares/   # authenticate, requireMember, requireOwner
├── plugins/       # swagger, jwt, cookie, cors, multipart, helmet, rate-limit
└── types/         # Local TypeScript types
```

Data flows one way: `route -> controller -> service -> repository -> Prisma`.
A service never imports Prisma directly, and a controller never imports a
repository directly.

## Adding an endpoint

1. Define the Zod input/output schemas in `routes/`, alongside the route
   registration. Both request and response are validated.
2. Add a controller method that parses the request, calls the service, and
   shapes the response. No business logic here.
3. Implement the logic in the matching service. If it needs data, call a
   repository method, don't reach for Prisma directly.
4. Add the repository method if it doesn't exist yet, keeping Prisma calls
   isolated there.
5. Apply the right middleware (`authenticate`, `requireMember`, `requireOwner`)
   based on the role table in [docs/architecture.md](../architecture.md#roles--permissions).
6. Add the route to [docs/api/api_endpoints.md](../api/api_endpoints.md) (and its
   French mirror).
7. Write a unit test for the service (repository mocked) and an integration
   test for the endpoint via `fastify.inject()`.

## Adding a Prisma model or migration

```bash
npx prisma migrate dev --name <description>
```

- Update `seed.ts` if the new model needs seed data (system templates, admin
  user, etc.).
- Never edit a migration file that has already been applied on another
  environment; create a new one instead.
- Dropping a column or table is a destructive action and requires explicit
  confirmation before running the migration.

## Testing conventions

```bash
pnpm --filter api test              # Vitest (unit + integration)
pnpm --filter api test:coverage     # Coverage report (target >= 80%)
```

- Unit tests live in `apps/api/tests/unit/`: services are tested with
  repositories mocked, no database involved.
- Integration tests live in `apps/api/tests/integration/`: a real Fastify
  instance via `fastify.inject()`, run against a dedicated test database
  (`DATABASE_URL_TEST`), never the dev database. See
  [docs/testing.md](../testing.md) for the local setup.
- Every endpoint is tested happy path plus the relevant 401/403/404 scenarios.
- Every service method needs at least one unit test.

## Conventions

- Functions are named verb-first: `createCollection`, `claimPuzzle`,
  `verifyEmail`.
- Every exported function, class, and type has a JSDoc comment.
- TypeScript strict mode: no `any`, no `@ts-ignore`.
- Environment variables are validated via Zod at startup; add new variables to
  both `apps/api/.env.example` and the startup schema together.
- All API errors follow `{ error: string, message: string, statusCode: number }`.
- Commit messages follow Conventional Commits with a mandatory file list; see
  the repository's `CLAUDE.md`.
