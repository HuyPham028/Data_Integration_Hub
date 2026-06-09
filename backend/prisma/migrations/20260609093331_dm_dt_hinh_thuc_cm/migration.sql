-- DropIndex
DROP INDEX "dm_dt_hinh_thuc_cm_ma_key";

-- DropIndex
DROP INDEX "dm_dt_hinh_thuc_cm_ma_idx";

-- AlterTable
ALTER TABLE "dm_nhom_luong" ALTER COLUMN "heSoLuong" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "dm_dt_hinh_thuc_cm" ADD COLUMN     "noiDaoTao" TEXT,
ALTER COLUMN "ma" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "dm_dt_hinh_thuc_cm_id_idx" ON "dm_dt_hinh_thuc_cm"("id");