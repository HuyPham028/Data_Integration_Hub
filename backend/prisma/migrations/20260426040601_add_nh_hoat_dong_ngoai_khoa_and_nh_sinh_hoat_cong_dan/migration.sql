-- CreateTable
CREATE TABLE "nh_hoat_dong_ngoai_khoa" (
    "id" VARCHAR(36) NOT NULL,
    "maNguoiHoc" VARCHAR(10),
    "namHocHocKy" INTEGER,
    "tenHoatDong" VARCHAR(20),
    "noiDung" VARCHAR(255),
    "ngayBd" TIMESTAMP(3),
    "ngayKt" TIMESTAMP(3),
    "ngayThamGia" DOUBLE PRECISION,
    "soNgay" DOUBLE PRECISION,
    "diaDiem" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nh_hoat_dong_ngoai_khoa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nh_sinh_hoat_cong_dan" (
    "id" VARCHAR(36) NOT NULL,
    "maNguoiHoc" VARCHAR(10),
    "dotSinhHoat" VARCHAR(100),
    "chuyenDe" VARCHAR(255),
    "ngayBd" TIMESTAMP(3),
    "ngayKt" TIMESTAMP(3),
    "kqThamGia" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nh_sinh_hoat_cong_dan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "nh_hoat_dong_ngoai_khoa_maNguoiHoc_idx" ON "nh_hoat_dong_ngoai_khoa"("maNguoiHoc");

-- CreateIndex
CREATE INDEX "nh_sinh_hoat_cong_dan_maNguoiHoc_idx" ON "nh_sinh_hoat_cong_dan"("maNguoiHoc");
