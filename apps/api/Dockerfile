# ─── base ──────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS base
RUN corepack enable

# ─── deps — install all workspace dependencies ─────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

# ─── dev — hot reload with tsx watch ──────────────────────────────────────────
FROM deps AS dev
WORKDIR /app
COPY tsconfig.json ./
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared
RUN pnpm --filter api exec prisma generate
EXPOSE 3000
CMD ["pnpm", "--filter", "api", "dev"]

# ─── build — compile TypeScript ────────────────────────────────────────────────
FROM deps AS build
WORKDIR /app
COPY tsconfig.json ./
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared
RUN pnpm --filter api exec prisma generate
RUN pnpm --filter api build

# ─── production — minimal runtime image ───────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app
RUN corepack enable
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/prisma ./prisma
COPY apps/api/package.json ./
# pnpm does not hoist workspace dep binaries to root node_modules/.bin — create
# a wrapper script so `node_modules/.bin/prisma` is callable in production.
RUN PRISMA_JS="$(find ./node_modules/.pnpm -maxdepth 5 -path '*/prisma/build/index.js' 2>/dev/null | head -1)" \
    && printf '#!/bin/sh\nexec node "%s" "$@"\n' "$PRISMA_JS" > ./node_modules/.bin/prisma \
    && chmod +x ./node_modules/.bin/prisma
EXPOSE 3000
CMD ["node", "dist/index.js"]
