-- AlterTable
ALTER TABLE "nguoi_hoc" ADD COLUMN     "hinhThePath" VARCHAR(500);

-- CreateTable
CREATE TABLE "dm_khen_thuong" (
    "id" SERIAL NOT NULL,
    "ma" VARCHAR(10) NOT NULL,
    "ten" VARCHAR(200) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "dm_khen_thuong_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dm_phuong_thuc_khen_thuong" (
    "id" SERIAL NOT NULL,
    "ma" VARCHAR(10) NOT NULL,
    "ten" VARCHAR(200) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "dm_phuong_thuc_khen_thuong_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "backup_retention_policy" (
    "trigger" TEXT NOT NULL,
    "days" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "backup_retention_policy_pkey" PRIMARY KEY ("trigger")
);

-- CreateIndex
CREATE UNIQUE INDEX "dm_khen_thuong_ma_key" ON "dm_khen_thuong"("ma");

-- CreateIndex
CREATE INDEX "dm_khen_thuong_ma_idx" ON "dm_khen_thuong"("ma");

-- CreateIndex
CREATE UNIQUE INDEX "dm_phuong_thuc_khen_thuong_ma_key" ON "dm_phuong_thuc_khen_thuong"("ma");

-- CreateIndex
CREATE INDEX "dm_phuong_thuc_khen_thuong_ma_idx" ON "dm_phuong_thuc_khen_thuong"("ma");
