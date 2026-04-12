/*
  Warnings:

  - You are about to drop the `permissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `role_permissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_roles` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `type` to the `roles` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('admin', 'reader', 'writer');

-- DropForeignKey
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_permission_id_fkey";

-- DropForeignKey
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_role_id_fkey";

-- DropForeignKey
ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_role_id_fkey";

-- DropForeignKey
ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_user_id_fkey";

-- DropIndex
DROP INDEX "nguoi_hoc_cccdSo_key";

-- AlterTable
ALTER TABLE "nguoi_hoc" ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "nguoi_hoc_id_seq";

-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "tablePatterns" TEXT[],
ADD COLUMN     "type" "RoleType" NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role_id" INTEGER;

-- DropTable
DROP TABLE "permissions";

-- DropTable
DROP TABLE "role_permissions";

-- DropTable
DROP TABLE "user_roles";

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
