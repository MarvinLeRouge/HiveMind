[🇫🇷 Version française](architecture.fr.md) | 🇬🇧 English version

# HiveMind - Architecture

[← Back to README](../README.md)

---

## Repository layout

```
HiveMind/
├── apps/
│   ├── api/                    # Fastify 5 backend
│   │   ├── src/
│   │   │   ├── routes/         # Route definitions + Zod schemas
│   │   │   ├── controllers/    # Request/response handling
│   │   │   ├── services/       # Business logic
│   │   │   ├── repositories/   # Prisma data access
│   │   │   ├── middlewares/    # authenticate, requireMember, requireOwner
│   │   │   ├── plugins/        # Fastify plugins (swagger, jwt, cors, cookie, multipart, helmet, rate-limit)
│   │   │   └── types/          # Local TypeScript types
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   └── tests/
│   │       ├── unit/           # Service tests (repositories mocked)
│   │       └── integration/    # fastify.inject() endpoint tests
│   └── web/                    # Vue 3 frontend
│       ├── src/
│       │   ├── pages/          # Route-level components
│       │   ├── components/     # Reusable UI components (shadcn-vue)
│       │   ├── stores/         # Pinia stores
│       │   ├── router/         # Vue Router + auth guard
│       │   ├── composables/    # Shared composition functions
│       │   ├── i18n/           # vue-i18n setup + EN/FR locale files
│       │   └── types/          # Local TypeScript types
│       └── tests/
├── packages/
│   └── shared/                 # Shared TypeScript types + Zod schemas
│       └── src/
│           ├── schemas/        # Zod schemas shared between api and web
│           └── types/          # TypeScript types inferred from schemas
├── .github/workflows/
│   ├── ci.yml                  # Lint + unit + integration tests + Codecov
│   ├── e2e.yml                 # Playwright E2E (35 tests, Chromium, gates CD)
│   └── build-deploy.yml        # Build images + deploy to VPS
├── docker-compose.yml          # Dev stack (hot reload)
├── docker-compose.prod.yml     # Prod stack (Traefik labels)
└── pnpm-workspace.yaml
```

---

## Backend - layered service architecture

Controllers are thin: all business logic lives in services. Repositories handle all Prisma calls and expose no business logic.

```
apps/api/src/
├── routes/        # Route definitions + Zod schemas (input + output)
├── controllers/   # Request/response handling - delegates to services
├── services/      # Business logic - no Prisma calls here
├── repositories/  # Prisma data access - no business logic here
├── middlewares/   # authenticate, requireMember, requireOwner
├── plugins/       # Fastify plugins: swagger, jwt, cookie, cors, multipart, helmet, rate-limit
└── types/         # Local TypeScript types
```

**Error format:** all API errors follow `{ error: string, message: string, statusCode: number }`.

**Environment variables** are validated via Zod at startup; the process exits with a clear message if any required variable is missing.

---

## Frontend - Vue 3 Composition API

Pages delegate to Pinia stores. Components are reusable and shadcn-vue based. The ofetch client handles JWT headers and silent token refresh on 401.

```
apps/web/src/
├── pages/         # Route-level components
├── components/    # Reusable UI components (shadcn-vue based)
├── stores/        # Pinia stores (useAuthStore, useCollectionStore, etc.)
├── router/        # Vue Router + auth guard
├── composables/   # Shared composition functions
├── i18n/          # vue-i18n setup + EN/FR locale files
└── types/         # Local TypeScript types
```

---

## Shared package

```
packages/shared/src/
├── schemas/       # Zod schemas shared between api and web
└── types/         # TypeScript types inferred from Zod schemas
```

---

## Roles & permissions

| Action | admin_platform | owner | member |
|---|:-:|:-:|:-:|
| Manage system templates | yes | - | - |
| Create collection | yes | yes | yes |
| Invite members | yes | yes | - |
| Delete collection | yes | yes | - |
| Edit collection config | yes | yes | - |
| Add / edit / reorder puzzles | yes | yes | - |
| Claim puzzle (working on) | yes | yes | yes |
| Add note | yes | yes | yes |
| Add attempt | yes | yes | yes |
| Change puzzle status | yes | yes | yes |

A user's role is per-collection (`CollectionMember.role`). `User.isAdmin = true` grants `admin_platform` rights globally.
