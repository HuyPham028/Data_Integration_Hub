-- DropIndex
DROP INDEX IF EXISTS "dm_dt_hinh_thuc_cm_ma_key";

-- DropIndex
DROP INDEX IF EXISTS "dm_dt_hinh_thuc_cm_ma_idx";

-- AlterTable
ALTER TABLE "dm_dt_hinh_thuc_cm" ADD COLUMN IF NOT EXISTS "noiDaoTao" TEXT,
ALTER COLUMN "ma" DROP NOT NULL;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "dm_dt_hinh_thuc_cm_id_idx" ON "dm_dt_hinh_thuc_cm"("id");