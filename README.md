# NestJS Auth Service

This is a robust authentication service built with **NestJS**, designed to handle user authentication, session management, OAuth integration, two-factor authentication (2FA), and administrative user/session management. The project uses **Prisma** for database operations, **PostgreSQL** for data storage, **Redis** for token management, and **Nodemailer** for email services.

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
  - [Auth](#auth)
  - [Users](#users)
  - [Sessions](#sessions)
  - [Admin](#admin)
  - [Access Logs](#access-logs)
  - [OAuth](#oauth)
- [Database Schema](#database-schema)
- [Roadmap](#roadmap)

## Features
- **User Authentication**:
  - Registration with email verification.
  - Login with JWT (access/refresh tokens).
  - Two-factor authentication (2FA) with QR code support.
  - Password reset and OAuth password setup.
- **Session Management**:
  - Track and manage user sessions (device, IP, location).
  - Terminate individual or all sessions.
- **OAuth Integration**:
  - Google and Yandex OAuth2 support.
  - Manage connected OAuth accounts.
- **Admin Features**:
  - Create, update, block, or delete users.
  - View and manage all user sessions and access logs.
- **Access Logs**:
  - Detailed logging of user actions (login, logout, 2FA, etc.).
  - Admin filtering by user, event type, or IP.
- **Security**:
  - JWT-based authentication with httpOnly cookies for refresh tokens.
  - Validation pipes for secure DTO handling.
  - CORS configuration for frontend integration.
- **Swagger Documentation**:
  - API documentation available at `/api`.

## Tech Stack
- **Node.js**: v20+
- **NestJS**: v10+
- **Prisma**: ORM for database management
- **PostgreSQL**: Primary database
- **Redis**: Token storage
- **Nodemailer**: Email sending (e.g., verification, password reset)
- **JWT**: Access and refresh tokens
- **Swagger**: API documentation
- **Docker**: Containerized deployment

## Architecture
The project follows a modular architecture:
- **Auth Module**: Handles registration, login, logout, token refresh, email verification, and OAuth.
- **Users Module**: Manages user profiles, password changes, and 2FA setup.
- **Sessions Module**: Tracks and manages user sessions.
- **Admin Module**: Provides admin controls for users and sessions.
- **Access Logs Module**: Logs user actions for auditing.
- **Common Module**: Shared utilities and configurations.

**Diagram**:
```
[Frontend] <-> [NestJS API]
   |              |
   |              v
[Redis] <-> [PostgreSQL]
   |              |
   v              v
[Nodemailer]   [Swagger]
```

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/webDeweloper88/fullstack
   cd fullstack
   ```
2. Install dependencies:
   ```bash
   npm ci
   ```
3. Set up environment variables (see [Environment Variables](#environment-variables)).
4. Generate Prisma client and run migrations:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```
5. Start the application:
   ```bash
   npm run start:dev
   ```
6. Access the API at `http://localhost:3000/api` (Swagger UI).

## Environment Variables
Create a `.env` file in the root directory with the following variables:
```
NODE_ENV=development
APP_PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
REDIS_URL=redis://localhost:6379
JWT_AT_SECRET=your_access_secret
JWT_RT_SECRET=your_refresh_secret
MAIL_HOST=smtp.gmail.com
MAIL_PORT=465
MAIL_USER=your@gmail.com
MAIL_PASS=your_app_password
CORS_ORIGIN=http://localhost:5173
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/oauth/google/callback
YANDEX_CLIENT_ID=your_yandex_client_id
YANDEX_CLIENT_SECRET=your_yandex_client_secret
YANDEX_REDIRECT_URI=http://localhost:3000/auth/oauth/yandex/callback
```

## API Endpoints
All endpoints are documented via Swagger at `/api`. Below is a summary of key endpoints.

### Auth
- **POST /auth/register**: Register a new user.
  - Body: `{ email, password, displayName }`
  - Response: 201 (Verification email sent)
- **GET /auth/verify-email?token=...**: Verify email with token.
  - Response: 200 (Email verified), 400 (Already verified), 404 (Invalid token)
- **POST /auth/resend-verification**: Resend verification email.
  - Body: `{ email }`
  - Response: 200 (Email sent), 400 (Already verified), 404 (User not found)
- **POST /auth/login**: Log in user and return tokens.
  - Body: `{ email, password, client }`
  - Response: 200 (Access/refresh tokens), 401 (Invalid credentials or 2FA required)
- **PATCH /auth/logout**: Log out and invalidate session.
  - Headers: `Authorization: Bearer <access_token>`
  - Response: 200 (Logged out)
- **POST /auth/refresh**: Refresh access token using refresh token.
  - Headers: `Authorization: Bearer <refresh_token>`
  - Response: 200 (New access token)
- **POST /auth/set-password**: Set password for OAuth users.
  - Headers: `Authorization: Bearer <access_token>`
  - Body: `{ password }`
  - Response: 200 (Password set)

### Users
- **GET /user/profile**: Get current user profile.
  - Headers: `Authorization: Bearer <access_token>`
  - Response: `{ id, email, displayName, pictureUrl, role, accountStatus, createdAt, updatedAt }`
- **PATCH /user/update-profile**: Update user profile.
  - Headers: `Authorization: Bearer <access_token>`
  - Body: `{ displayName, pictureUrl }`
  - Response: Updated profile
- **PATCH /user/me/change-password**: Change user password.
  - Headers: `Authorization: Bearer <access_token>`
  - Body: `{ currentPassword, newPassword }`
  - Response: 200 (Password changed), 400 (Invalid current password)
- **GET /user/me/access-logs**: Get user access logs.
  - Headers: `Authorization: Bearer <access_token>`
  - Response: Array of logs `{ id, eventType, ipAddress, userAgent, createdAt }`
- **POST /user/me/2fa/setup**: Set up 2FA (returns QR code and secret).
  - Headers: `Authorization: Bearer <access_token>`
  - Response: `{ qrCodeImage, secret }`
- **POST /user/me/2fa/verify**: Verify 2FA setup.
  - Headers: `Authorization: Bearer <access_token>`
  - Body: `{ token, secret }`
  - Response: 200 (2FA enabled)

### Sessions
- **GET /users/me/sessions**: Get current user sessions.
  - Headers: `Authorization: Bearer <access_token>`
  - Response: Array of sessions `{ id, device, ipAddress, location, lastActive, expiresAt, isCurrent }`
- **DELETE /users/me/sessions**: Terminate all sessions except current.
  - Headers: `Authorization: Bearer <access_token>`
  - Response: 204 (Sessions terminated)
- **DELETE /users/me/sessions/all**: Terminate all sessions including current.
  - Headers: `Authorization: Bearer <access_token>`
  - Response: 204 (Sessions terminated)
- **DELETE /users/me/sessions/{id}**: Terminate specific session.
  - Headers: `Authorization: Bearer <access_token>`
  - Response: 204 (Session terminated)

### Admin
- **POST /admin/users/create-user-by-admin**: Create a new user (admin only).
  - Headers: `Authorization: Bearer <access_token>`
  - Body: `{ email, hash, displayName, pictureUrl, role, accountStatus }`
  - Response: 200 (User created), 403 (Forbidden), 409 (User exists)
- **GET /admin/users/find-all**: List users with filters and pagination.
  - Query: `?role=user|admin&status=PENDING|ACTIVE|BLOCKED|DELETED&email=...&page=1&limit=10`
  - Response: List of users
- **GET /admin/users/find-by-id/{id}**: Get user by ID.
  - Response: User profile or 204 (Not found)
- **PATCH /admin/users/update-by-admin/{id}**: Update user role/status.
  - Body: `{ role, accountStatus }`
  - Response: Updated profile
- **DELETE /admin/users/delete-by-admin/{id}**: Mark user as deleted.
  - Response: 200 (User marked deleted)
- **PATCH /admin/users/users/{id}/block**: Block user.
  - Response: 200 (User blocked)
- **PATCH /admin/users/users/{id}/unblock**: Unblock user.
  - Response: 200 (User unblocked)
- **GET /admin/sessions**: List all sessions with filters.
  - Query: `?page=1&limit=10&ipAddress=...&device=...&userId=...`
  - Response: List of sessions
- **DELETE /admin/sessions**: Delete all sessions (use with caution).
  - Response: 200 (Sessions deleted)
- **GET /admin/sessions/user/{userId}**: Get sessions for a user.
  - Response: List of sessions
- **DELETE /admin/sessions/user/{userId}**: Delete all sessions for a user.
  - Response: 200 (Sessions deleted)
- **DELETE /admin/sessions/{id}**: Delete specific session.
  - Response: 204 (Session deleted)

### Access Logs
- **GET /access-log**: Get access logs (admin only).
  - Query: `?userId=...&eventType=REGISTER|LOGIN_SUCCESS|...&ipAddress=...&page=1&limit=20`
  - Response: List of logs `{ id, eventType, ipAddress, userAgent, createdAt }`
- **GET /user/{id}/access-logs**: Get access logs for a specific user (admin only).
  - Response: List of logs

### OAuth
- **GET /auth/oauth/google**: Redirect to Google OAuth.
- **GET /auth/oauth/yandex**: Redirect to Yandex OAuth.
- **GET /auth/oauth/google/callback**: Google OAuth callback (returns access token).
- **GET /auth/oauth/yandex/callback**: Yandex OAuth callback (returns access token).
- **DELETE /auth/oauth/disconnect/{provider}**: Disconnect OAuth account.
  - Headers: `Authorization: Bearer <access_token>`
  - Response: 200 (Disconnected), 400 (Last login method), 404 (Account not found)
- **GET /auth/oauth/accounts**: List connected OAuth accounts.
  - Query: `?provider=google&page=1&limit=10`
  - Response: List of accounts

## Database Schema
The database is managed by **Prisma** with **PostgreSQL**. Below are the main models:

### User
- `id`: UUID (primary key)
- `email`: Unique string
- `displayName`: String (optional)
- `pictureUrl`: String (optional, typo in schema: `picktureUrl`)
- `hash`: Password hash
- `hashRt`: Refresh token hash
- `role`: Enum (user, admin)
- `accountStatus`: Enum (PENDING, ACTIVE, BLOCKED, DELETED)
- `emailVerified`: Boolean
- `emailVerificationToken`: String (optional)
- `emailVerificationTokenExpiresAt`: DateTime (optional)
- `resetPasswordToken`: String (optional)
- `resetPasswordExpiresAt`: DateTime (optional)
- `twoFactorEnabled`: Boolean
- `twoFactorSecret`: String (optional)
- `twoFactorExpiresAt`: DateTime (optional)
- `createdAt`, `updatedAt`: DateTime
- Relations: `AccessLog[]`, `Session[]`, `OAuthAccount[]`

### Session
- `id`: UUID (primary key)
- `userId`: Foreign key to User
- `ipAddress`: String
- `userAgent`: String (optional)
- `device`: String (optional, e.g., "Windows 10 · Chrome")
- `client`: String (optional, e.g., "web", "mobile")
- `location`: String (optional, e.g., "Tashkent, Uzbekistan")
- `createdAt`, `updatedAt`, `expiresAt`: DateTime
- Relation: `User`

### AccessLog
- `id`: UUID (primary key)
- `userId`: Foreign key to User
- `eventType`: Enum (REGISTER, LOGIN_SUCCESS, LOGIN_FAIL, etc.)
- `ipAddress`: String (optional)
- `userAgent`: String (optional)
- `createdAt`: DateTime
- Relation: `User`

### OAuthAccount
- `id`: UUID (primary key)
- `provider`: String (e.g., "google", "yandex")
- `providerId`: String (provider's user ID)
- `email`: String (optional)
- `accessToken`: String (optional)
- `refreshToken`: String (optional)
- `userId`: Foreign key to User
- `createdAt`, `updatedAt`: DateTime
- Relation: `User`

### Enums
- `UserRole`: user, admin
- `AccountStatus`: PENDING, ACTIVE, BLOCKED, DELETED
- `LogEventType`: REGISTER, LOGIN_SUCCESS, LOGIN_FAIL, EMAIL_VERIFIED, EMAIL_RESEND, EMAIL_FAILED, PASSWORD_CHANGED, ACCOUNT_BLOCKED, ACCOUNT_UNLOCKED, LOGIN_2FA_REQUIRED, ENABLE_2FA, DISABLE_2FA, LOGOUT, LOGIN_OAUTH_SUCCESS, LOGIN_OAUTH_FAIL, OAUTH_DISCONNECT, PASSWORD_SET_OAUTH_SUCCESS

## Roadmap
- Implement rate-limiting for brute-force protection.
- Add refresh token rotation for enhanced security.
- Support additional OAuth providers (e.g., GitHub).
- Enhance admin dashboard with analytics for access logs.