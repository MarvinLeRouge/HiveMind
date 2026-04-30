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
COPY apps/api/package.json ./
EXPOSE 3000
CMD ["node", "dist/index.js"]
