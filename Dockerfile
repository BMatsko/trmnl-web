FROM oven/bun:1-alpine AS build

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

RUN bun run build

FROM oven/bun:1-alpine

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY server.js ./server.js

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/healthz >/dev/null || exit 1

CMD ["bun", "server.js"]
