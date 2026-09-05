[🇫🇷 Version française](frontend_developer_guide.fr.md) | 🇬🇧 English version

---

# Frontend developer guide

This guide covers day-to-day frontend development conventions. See
[docs/architecture.md](../architecture.md) for the structure overview and
[docs/design-system.md](../design-system.md) for the current visual language.

## Getting started

```bash
docker compose up -d           # Full dev stack (backend · frontend · db)
pnpm --filter web dev          # Or run the frontend alone (Vite HMR)
```

See [docs/operations.md](../operations.md) for the Docker Compose details.

## Structure

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

Pages delegate to Pinia stores for data and mutations; components stay
presentational where possible.

## Adding a page

1. Create the page component under `pages/`.
2. Add a Pinia store under `stores/` if the page needs its own state, following
   the existing stores (`useCollectionStore`, `usePuzzleStore`, etc.) as a
   pattern: state, loading/error flags, actions calling the API client.
3. Register the route in `router/`, applying the auth guard if the page
   requires a logged-in user.
4. Add any new UI text to both `i18n/locales/en.json` and `fr.json`; never
   hardcode user-facing strings.
5. Add a `.spec.ts` test file alongside the page.

## API calls and auth

- All HTTP calls go through the shared `ofetch` client, which attaches the
  JWT access token and silently refreshes it on a 401 before retrying once.
- Never call `fetch` directly from a component or store; add a method to the
  relevant store (or a composable if it's shared across stores) instead.
- Shapes for request/response payloads come from `packages/shared`, not
  redefined locally, so backend and frontend can't drift apart.

## Styling conventions

- Use the CSS custom properties defined in `apps/web/src/assets/main.css`
  (see [docs/design-system.md](../design-system.md)) rather than hardcoding
  colours or spacing.
- Puzzle status colors use the semantic `--status-*` tokens, not raw Tailwind
  color utilities, so they stay correct in dark mode.
- Respect the `:focus-visible` ring and `prefers-reduced-motion` support
  already in place.

## Testing conventions

```bash
pnpm --filter web test              # Vitest + Vue Test Utils
pnpm --filter web test:coverage     # Coverage report (target >= 80%)
```

Mirror the test structure to the source structure: a page's spec file sits
alongside the page, a store's spec file alongside the store. JSDOM
environment.

## Internationalization

All user-facing strings go through `vue-i18n`, with `en.json` and `fr.json`
kept in sync in `i18n/locales/`. The language toggle persists the user's
preference via `PATCH /auth/me`.
