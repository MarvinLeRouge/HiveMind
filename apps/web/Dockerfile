# ─── base ──────────────────────────────────────────────────────────────────────
FROM node:26-alpine AS base
# Node 25+ no longer bundles corepack; pnpm version still comes from packageManager
RUN npm install -g corepack@0.36.0 && corepack enable

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
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
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
