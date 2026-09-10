# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=22.13.0

FROM node:${NODE_VERSION}-bookworm-slim AS deps
WORKDIR /app

ENV npm_config_audit=false \
    npm_config_fund=false \
    npm_config_update_notifier=false

COPY package.json package-lock.json ./

RUN --mount=type=cache,id=fatemeh-npm-cache,target=/root/.npm \
    npm ci --prefer-offline

FROM deps AS dev
ENV NODE_ENV=development \
    WRANGLER_LOG_PATH=/app/.wrangler/wrangler.log \
    WRANGLER_WRITE_LOGS=false \
    MINIFLARE_REGISTRY_PATH=/app/.wrangler/registry

COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

FROM deps AS build
ENV NODE_ENV=production \
    WRANGLER_LOG_PATH=/app/.wrangler/wrangler.log \
    WRANGLER_WRITE_LOGS=false \
    MINIFLARE_REGISTRY_PATH=/app/.wrangler/registry

COPY . .
RUN npm run build

FROM node:${NODE_VERSION}-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    WRANGLER_LOG_PATH=/app/.wrangler/wrangler.log \
    WRANGLER_WRITE_LOGS=false \
    MINIFLARE_REGISTRY_PATH=/app/.wrangler/registry

COPY --from=build /app ./

EXPOSE 3000
CMD ["npm", "run", "start"]
