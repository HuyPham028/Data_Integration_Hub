-- DropIndex
DROP INDEX IF EXISTS "dm_dt_chung_chi_tin_hoc_ma_key";

-- DropIndex
DROP INDEX IF EXISTS "dm_dt_chung_chi_tin_hoc_ma_idx";

-- AlterTable
ALTER TABLE "dm_dt_chung_chi_tin_hoc" ADD COLUMN IF NOT EXISTS "thoiHan" TEXT,
ALTER COLUMN "ma" DROP NOT NULL;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "dm_dt_chung_chi_tin_hoc_id_idx" ON "dm_dt_chung_chi_tin_hoc"("id");