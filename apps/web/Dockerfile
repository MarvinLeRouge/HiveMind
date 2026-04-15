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

# ─── dev — Vite HMR ────────────────────────────────────────────────────────────
FROM deps AS dev
WORKDIR /app
COPY tsconfig.json ./
COPY apps/web ./apps/web
COPY packages/shared ./packages/shared
EXPOSE 5173
CMD ["pnpm", "--filter", "web", "dev"]

# ─── build — Vite production build ─────────────────────────────────────────────
FROM deps AS build
WORKDIR /app
COPY tsconfig.json ./
COPY apps/web ./apps/web
COPY packages/shared ./packages/shared
RUN pnpm --filter web build

# ─── production — Nginx serving static assets ─────────────────────────────────
FROM nginx:alpine AS production
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
