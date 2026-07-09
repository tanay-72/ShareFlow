# syntax=docker/dockerfile:1
#
# Build context is the monorepo root (see docker-compose.yml) for the same
# pnpm-workspace reason as apps/api/Dockerfile.
#
# Vite inlines `import.meta.env.VITE_*` values at BUILD time, not at
# container start — there is no "runtime env" for a static SPA bundle. The
# API's base URL is therefore passed in as a build ARG, not a normal
# Compose `environment:` entry.

FROM node:20-alpine AS build
RUN corepack enable
WORKDIR /repo

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile --filter @shareflow/shared --filter @shareflow/web

COPY packages/shared packages/shared
COPY apps/web apps/web

RUN pnpm --filter @shareflow/shared build

ARG VITE_API_BASE_URL=http://localhost:4000
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN pnpm --filter @shareflow/web build

# ---------------------------------------------------------------------------

FROM nginx:1.27-alpine AS runtime
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
EXPOSE 80
