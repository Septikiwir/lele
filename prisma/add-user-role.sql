-- Add UserRole enum and role column to User table
CREATE TYPE "UserRole" AS ENUM ('SUPERADMIN', 'OWNER', 'OPERATOR');

ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'OWNER';
