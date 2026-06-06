-- DropIndex
DROP INDEX "dm_dt_hinh_thuc_cm_ma_key";

-- DropIndex
DROP INDEX "dm_dt_hinh_thuc_cm_ma_idx";

-- AlterTable
ALTER TABLE "dm_dt_hinh_thuc_cm" ALTER COLUMN "ma" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "dm_dt_hinh_thuc_cm_id_idx" ON "dm_dt_hinh_thuc_cm"("id");