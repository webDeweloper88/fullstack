# NestJS Auth (JWT + Sessions)

[![NestJS](https://img.shields.io/badge/NestJS-10+-e0234e?logo=nestjs&logoColor=white)](https://nestjs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://www.prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)](https://redis.io)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com)
[![Swagger](https://img.shields.io/badge/Swagger-OpenAPI-85EA2D?logo=swagger&logoColor=black)](https://dev-auth.domlab.uz/api)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

> **Demo (Swagger, dev):** https://dev-auth.domlab.uz/api

---

## ������������ Қисқача тавсиф (UZ)
NestJS асосидаги аутентификация хизмати: **JWT (access/refresh)**, **сессиялар метаданнолари** (IP/User-Agent) ва **email тасдиқлаш**. Refresh-токенлар **Redis**да TTL билан сақланади, сессиялар рўйхати **PostgreSQL**да. Swagger орқали APIни кўриш ва синаш мумкин.

**Асосий имкониятлар**
- Рўйхатдан ўтиш ва email тасдиқ (Handlebars шаблонлар)
- Логин → access (қисқа TTL) + refresh (Redis, TTL)
- Refresh орқали янгилаш, Logout ва Logout All
- `GET /users/me` ва сессиялар билан ишлаш (`/users/me/sessions`)
- **Ихтиёрий:** OAuth (Google/Yandex) — аккаунтга ташқи провайдер орқали кириш
- Swagger: https://dev-auth.domlab.uz/api

---

## Overview (EN)
Production-ready authentication service built with **NestJS + Prisma + PostgreSQL + Redis**. Supports **email verification**, **JWT access/refresh tokens**, and **session metadata**. API is documented with Swagger.

**Key features**
- Email verification via Handlebars templates
- Login with access/refresh tokens; refresh stored in Redis with TTL
- Token refresh, logout current device, logout all devices
- Session list & revoke by ID
- Optional **OAuth (Google/Yandex)** login
- Clean DTOs & validation; centralized error format (planned)

> **Roadmap:** 2FA (TOTP), rate-limit & brute-force protection, refresh rotation, OAuth account linking & safe disconnect.

---

## Architecture
```
┌─────────────────────────────────────────────────────────┐
│                    NestJS Application                   │
│                                                         │
│  AuthModule   UserModule   SessionModule   MailModule   │
│     │             │             │             │          │
│  JWT Service  UserService  SessionService  MailService  │
│     │             │             │             │          │
│  Guards/DTOs   Prisma ORM   Prisma ORM     Nodemailer   │
│     │             │             │             │          │
│  Access/Refresh Tokens   PostgreSQL (users, sessions)   │
│                       Redis (refresh TTL)               │
└─────────────────────────────────────────────────────────┘
```

> **Note:** Exact folder names may differ; see `src/` in this repo.

---

## Tech stack
- **Runtime:** Node.js 20, NestJS 10+
- **DB:** PostgreSQL + Prisma ORM
- **Cache/Token Store:** Redis (refresh tokens with TTL)
- **Mail:** Nodemailer + Handlebars templates (verify-email / password-reset)
- **Docs:** Swagger (OpenAPI)
- **CI/CD:** GitHub Actions (planned)
- **Containers:** Docker & docker-compose

---

## API (high-level)
- `POST /auth/register` — create account, send email verification
- `GET  /auth/verify-email?token=...` — confirm email
- `POST /auth/login` — get access & refresh tokens
- `POST /auth/refresh` — renew access via refresh token
- `POST /auth/logout` — logout current session
- `POST /auth/logout-all` — revoke all sessions for the user
- `GET  /users/me` — current user profile
- `GET  /users/me/sessions` — list sessions
- `DELETE /users/me/sessions/:id` — revoke a session by ID
- **(Optional)** `GET /oauth/google` → `GET /oauth/google/callback`
- **(Optional)** `GET /oauth/yandex` → `GET /oauth/yandex/callback`
- **(Optional)** `DELETE /oauth/disconnect/:provider`

> Full swagger: https://dev-auth.domlab.uz/api

---

## Environment variables
Create `.env` (or use Docker envs):

```env
# App
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname?schema=public

# Redis
REDIS_URL=redis://default:password@host:6379

# JWT (example names — adjust to your project)
JWT_AT_SECRET=changeme_access_secret
JWT_AT_TTL=15m
JWT_RT_SECRET=changeme_refresh_secret
JWT_RT_TTL=7d

# Mail (Gmail example)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=465
MAIL_SECURE=true
MAIL_USER=your@gmail.com
MAIL_PASS=your_app_password
MAIL_FROM=Your App <your@gmail.com>

# App URLs
APP_BASE_URL=http://localhost:3000
CLIENT_BASE_URL=http://localhost:5173
EMAIL_VERIFY_URL=${CLIENT_BASE_URL}/auth/verify-email
PASSWORD_RESET_URL=${CLIENT_BASE_URL}/auth/reset-password

# --- OAuth (Google) ---
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
# e.g. http://localhost:3000/oauth/google/callback or https://dev-auth.domlab.uz/oauth/google/callback
GOOGLE_REDIRECT_URI=${APP_BASE_URL}/oauth/google/callback
# Scopes are usually managed in code; keep for clarity if needed
GOOGLE_SCOPE="openid email profile"

# --- OAuth (Yandex) ---
YANDEX_CLIENT_ID=your_yandex_client_id
YANDEX_CLIENT_SECRET=your_yandex_client_secret
# e.g. http://localhost:3000/oauth/yandex/callback or https://dev-auth.domlab.uz/oauth/yandex/callback
YANDEX_REDIRECT_URI=${APP_BASE_URL}/oauth/yandex/callback
# Yandex scopes example
YANDEX_SCOPE="login:email"
```

---

## OAuth setup (Google & Yandex)
**Google**
1. Go to Google Cloud Console → APIs & Services → OAuth consent screen (External) → add test users (dev).
2. Create Credentials → **OAuth client ID** → Application type: **Web application**.
3. Add **Authorized redirect URIs**:  
   - `http://localhost:3000/oauth/google/callback`  
   - `https://dev-auth.domlab.uz/oauth/google/callback` (dev)  
   - `https://auth.domlab.uz/oauth/google/callback` (prod, if applicable)
4. Put values into `.env`: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`.

**Yandex**
1. Go to Yandex OAuth (oauth.yandex.ru) → Create application (Веб‑сервисы).
2. Add **Redirect URI**:  
   - `http://localhost:3000/oauth/yandex/callback`  
   - `https://dev-auth.domlab.uz/oauth/yandex/callback`  
   - `https://auth.domlab.uz/oauth/yandex/callback` (prod, if applicable)
3. Choose scope(s), at minimum: `login:email`.
4. Put values into `.env`: `YANDEX_CLIENT_ID`, `YANDEX_CLIENT_SECRET`, `YANDEX_REDIRECT_URI`.

> Ensure your Nest strategies use these env vars and the callback routes above. Adjust if your routes differ.

---

## Local development
**Prerequisites:** Node.js 20+, npm, Docker (optional), PostgreSQL & Redis.

```bash
# 1) Install deps
npm ci

# 2) Generate Prisma client
npx prisma generate

# 3) Migrate DB (creates tables)
npx prisma migrate dev

# 4) Run the app (watch)
npm run start:dev

# 5) Open Swagger
# http://localhost:3000/api
```

### Using Docker Compose
If you prefer containers, the repo includes `docker-compose.yml`:

```bash
# Build & run (detached)
docker compose up -d --build

# Follow logs
docker compose logs -f api
```

> Ensure `.env` is configured before starting the API container.

---

## Email templates
- Templates live under `src/mail/templates` and are copied to `dist` via `nest-cli.json` assets.
- Example files: `verify-email.hbs`, `password-reset.hbs`.
- In production the app resolves templates from `dist/mail/templates` (falls back to `src` in dev).

---

## Security checklist
- [ ] Store refresh tokens ONLY in Redis with TTL
- [ ] Consider **httpOnly + Secure cookies** for refresh tokens
- [ ] Add **rate limiting** to `/auth/login` and `/auth/refresh`
- [ ] Implement **brute-force** protection (IP/username throttling)
- [ ] Use **argon2/bcrypt** for password hashing
- [ ] Enforce strong password policy & validation
- [ ] Rotate secrets & never commit `.env`
- [ ] Enable CORS with allowlist
- [ ] Safe OAuth linking/unlink (do not allow removal of the last auth method)

---

## Project scripts
```json
{
  "scripts": {
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main.js",
    "build": "nest build",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "test": "jest",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev"
  }
}
```

---

## Folder structure (excerpt)
```
├─ prisma/                  # schema.prisma, migrations
├─ src/
│  ├─ auth/                 # controllers, services, strategies, guards
│  ├─ users/
│  ├─ sessions/
│  ├─ mail/                 # MailService, templates (.hbs)
│  ├─ common/               # dto, pipes, filters (if applicable)
│  └─ main.ts
├─ docker-compose.yml
├─ Dockerfile
├─ nest-cli.json
└─ README.md
```
> Note: Module/folder names may differ; adjust to your actual layout.

---

## Contributing
PRs and suggestions are welcome — especially around security hardening, DTO design, and refresh rotation.

---

## License
MIT — see [LICENSE](./LICENSE). Adjust if you prefer a different license.

---

## Credits
Built by **webDeweloper88**. Feedback is welcome in the NestJS community.
