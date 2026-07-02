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

# ─── build — compile TypeScript and bundle production deployment ───────────────
FROM deps AS build
WORKDIR /app
COPY tsconfig.json ./
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared
RUN pnpm --filter api exec prisma generate
RUN pnpm --filter api build
# Bundle all production deps into a self-contained directory (no pnpm symlinks).
# pnpm deploy flattens node_modules so Node.js module resolution works from /app/dist/.
RUN pnpm --filter api deploy /deployed && \
    cp -r apps/api/dist /deployed/dist && \
    cp -r apps/api/prisma /deployed/prisma && \
    cd /deployed && node_modules/.bin/prisma generate

# ─── production — minimal runtime image ───────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=build /deployed ./
EXPOSE 3000
CMD ["node", "dist/index.js"]
