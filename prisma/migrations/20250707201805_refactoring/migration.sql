/*
  Warnings:

  - The values [SUSPENDED] on the enum `AccountStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [LOGOUT,PASSWORD_RESET,PASSWORD_RESET_FAIL,EMAIL_VERIFICATION] on the enum `LogEventType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AccountStatus_new" AS ENUM ('PENDING', 'ACTIVE', 'BLOCKED', 'DELETED');
ALTER TABLE "users" ALTER COLUMN "account_status" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "account_status" TYPE "AccountStatus_new" USING ("account_status"::text::"AccountStatus_new");
ALTER TYPE "AccountStatus" RENAME TO "AccountStatus_old";
ALTER TYPE "AccountStatus_new" RENAME TO "AccountStatus";
DROP TYPE "AccountStatus_old";
ALTER TABLE "users" ALTER COLUMN "account_status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "LogEventType_new" AS ENUM ('REGISTER', 'LOGIN_SUCCESS', 'LOGIN_FAIL', 'EMAIL_VERIFIED', 'EMAIL_RESEND', 'EMAIL_FAILED', 'PASSWORD_CHANGED', 'ACCOUNT_BLOCKED', 'ACCOUNT_UNLOCKED');
ALTER TABLE "access_logs" ALTER COLUMN "event_type" TYPE "LogEventType_new" USING ("event_type"::text::"LogEventType_new");
ALTER TYPE "LogEventType" RENAME TO "LogEventType_old";
ALTER TYPE "LogEventType_new" RENAME TO "LogEventType";
DROP TYPE "LogEventType_old";
COMMIT;
