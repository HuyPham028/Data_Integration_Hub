/*
  Warnings:

  - You are about to drop the column `role_id` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `roles` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'reader', 'writer', 'user');

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_role_id_fkey";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "role_id",
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'reader',
ADD COLUMN     "role_settings" JSONB;

-- DropTable
DROP TABLE "roles";

-- DropEnum
DROP TYPE "RoleType";
