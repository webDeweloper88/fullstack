# ---------- Base ----------
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat
ENV NODE_ENV=production

# ---------- Deps (prod) ----------
FROM base AS deps
COPY package*.json ./
RUN npm ci --omit=dev

# ---------- Builder ----------
FROM base AS builder
COPY package*.json ./
RUN npm ci

# Конфиги и исходники
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY prisma ./prisma
COPY src ./src
# Если есть ассеты вне src — раскомментируй:
# COPY templates ./templates
# COPY public ./public

# 1) Prisma Client
RUN npx prisma generate
# 2) Сборка NestJS (без локального @nestjs/cli в devDeps)
RUN npx --yes @nestjs/cli@^10.0.0 build

# ---------- Runner ----------
FROM base AS runner
RUN addgroup -S app && adduser -S app -G app
USER app

# Берём node_modules из builder, чтобы был prisma CLI в рантайме
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist
COPY docker/entrypoint.sh ./entrypoint.sh

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT:-3000}/health || exit 1

ENV PORT=3000
EXPOSE 3000
ENTRYPOINT ["sh","./entrypoint.sh"]
