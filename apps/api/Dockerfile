# syntax=docker/dockerfile:1
#
# Build context is the monorepo root (see docker-compose.yml), because pnpm
# workspaces need the root lockfile/workspace manifest plus the
# @shareflow/shared package this app depends on. This single image is used
# for BOTH the `api` and `worker` Compose services — they run the same
# codebase with a different start command, so there is no separate
# Dockerfile for the worker (see the `command:` overrides in
# docker-compose.yml).

FROM node:20-alpine AS build
# Prisma's query/schema engine binaries are linked against OpenSSL, which
# Alpine's base image doesn't include — without this, `prisma generate`
# and the engine itself fail with a non-JSON error at the native binary
# level ("Could not parse schema engine response").
RUN apk add --no-cache openssl
RUN corepack enable
WORKDIR /repo

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --frozen-lockfile --filter @shareflow/shared --filter @shareflow/api

COPY packages/shared packages/shared
COPY apps/api apps/api

RUN pnpm --filter @shareflow/shared build
RUN pnpm --filter @shareflow/api exec prisma generate --schema=prisma/schema.prisma
RUN pnpm --filter @shareflow/api build

# ---------------------------------------------------------------------------

FROM node:20-alpine AS runtime
RUN apk add --no-cache openssl
RUN corepack enable
ENV NODE_ENV=production
WORKDIR /repo

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --frozen-lockfile --prod --filter @shareflow/shared --filter @shareflow/api

COPY --from=build /repo/packages/shared/dist packages/shared/dist
COPY --from=build /repo/apps/api/dist apps/api/dist
COPY apps/api/prisma apps/api/prisma

WORKDIR /repo/apps/api
# Regenerated against this stage's own node_modules layout rather than
# copied from the build stage, since pnpm's content-addressed node_modules
# symlinks don't necessarily line up 1:1 across separately-installed stages.
RUN pnpm exec prisma generate --schema=prisma/schema.prisma

RUN addgroup -S shareflow && adduser -S shareflow -G shareflow \
  && mkdir -p /data/storage && chown -R shareflow:shareflow /repo /data
USER shareflow

EXPOSE 4000
CMD ["sh", "-c", "pnpm exec prisma migrate deploy --schema=prisma/schema.prisma && node dist/main.js"]
