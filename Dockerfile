# ---------- Base ----------
FROM node:20-alpine AS base
WORKDIR /app
# Для prisma на alpine (musl) нужны openssl и совместимость libc
RUN apk add --no-cache openssl libc6-compat
ENV NODE_ENV=production

# ---------- Dependencies (prod) ----------
FROM base AS deps
# Копируем только пакеты для правильного кеширования
COPY package*.json ./
# Если используется npm: 
RUN npm ci --omit=dev

# ---------- Builder (dev deps для сборки) ----------
FROM base AS builder
COPY package*.json ./
# Нужны devDeps для сборки Nest + prisma generate
RUN npm ci
# Копируем исходники
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY prisma ./prisma
COPY src ./src
# Генерируем Prisma Client (для linux-musl)
ENV PRISMA_CLI_QUERY_ENGINE_TYPE=binary
RUN npx prisma generate
# Сборка Nest (в dist)
RUN npm run build

# ---------- Runner ----------
FROM base AS runner
# Непривилегированный пользователь
RUN addgroup -S app && adduser -S app -G app
USER app

# Копируем только нужное для рантайма
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist
COPY docker/entrypoint.sh ./entrypoint.sh

# Healthcheck (настраиваем под твой порт)
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT:-3000}/health || exit 1

ENV PORT=3000
EXPOSE 3000

ENTRYPOINT [ "sh", "./entrypoint.sh" ]
