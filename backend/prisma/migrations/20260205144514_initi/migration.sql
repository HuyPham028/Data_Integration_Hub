-- CreateTable
CREATE TABLE "dm_dt_van_bang_llct" (
    "id" SERIAL NOT NULL,
    "ma" VARCHAR(5) NOT NULL,
    "ten" VARCHAR(100) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "dm_dt_van_bang_llct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dm_hinh_thuc_ky_luat" (
    "id" SERIAL NOT NULL,
    "ma" VARCHAR(50) NOT NULL,
    "ten" VARCHAR(500) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "dm_hinh_thuc_ky_luat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dm_loai_can_bo" (
    "id" SERIAL NOT NULL,
    "ma" VARCHAR(5) NOT NULL,
    "ten" VARCHAR(50) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "dm_loai_can_bo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dm_loai_chuc_vu" (
    "id" SERIAL NOT NULL,
    "ma" VARCHAR(5) NOT NULL,
    "ten" VARCHAR(70) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "dm_loai_chuc_vu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dm_loai_phu_cap" (
    "id" SERIAL NOT NULL,
    "ma" VARCHAR(10) NOT NULL,
    "ten" VARCHAR(100) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "dm_loai_phu_cap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dm_ngach_cdnn" (
    "id" SERIAL NOT NULL,
    "ma" VARCHAR(20) NOT NULL,
    "ten" VARCHAR(100) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "dm_ngach_cdnn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dm_ngan_hang" (
    "id" SERIAL NOT NULL,
    "ma" VARCHAR(20) NOT NULL,
    "ten" VARCHAR(200) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "dm_ngan_hang_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dm_nhom_mau" (
    "id" SERIAL NOT NULL,
    "ma" VARCHAR(5) NOT NULL,
    "ten" VARCHAR(50) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "dm_nhom_mau_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dm_noi_cap_cccd" (
    "id" SERIAL NOT NULL,
    "ma" VARCHAR(10) NOT NULL,
    "ten" VARCHAR(100) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "dm_noi_cap_cccd_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dm_quan_ham" (
    "id" SERIAL NOT NULL,
    "ma" VARCHAR(10) NOT NULL,
    "ten" VARCHAR(50) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "dm_quan_ham_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dm_quan_he_gia_dinh" (
    "id" SERIAL NOT NULL,
    "ma" VARCHAR(5) NOT NULL,
    "ten" VARCHAR(50) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "dm_quan_he_gia_dinh_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dm_quoc_gia" (
    "id" SERIAL NOT NULL,
    "ma" VARCHAR(5) NOT NULL,
    "ten" VARCHAR(100) NOT NULL,
    "maChauLuc" VARCHAR(10),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "dm_quoc_gia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dm_thanh_phan_xuat_than" (
    "id" SERIAL NOT NULL,
    "ma" VARCHAR(10) NOT NULL,
    "ten" VARCHAR(100) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "dm_thanh_phan_xuat_than_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dm_ton_giao" (
    "id" SERIAL NOT NULL,
    "ma" VARCHAR(5) NOT NULL,
    "ten" VARCHAR(100) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "dm_ton_giao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dm_trinh_do_chuyen_mon" (
    "id" SERIAL NOT NULL,
    "ma" VARCHAR(5) NOT NULL,
    "ten" VARCHAR(50) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "dm_trinh_do_chuyen_mon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dm_trinh_do_pho_thong" (
    "id" SERIAL NOT NULL,
    "ma" VARCHAR(5) NOT NULL,
    "ten" VARCHAR(50) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "dm_trinh_do_pho_thong_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dm_xep_loai_chuyen_mon" (
    "id" SERIAL NOT NULL,
    "ma" VARCHAR(50) NOT NULL,
    "ten" VARCHAR(500) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "dm_xep_loai_chuyen_mon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dm_nhom_luong" (
    "id" SERIAL NOT NULL,
    "nhomLuong" VARCHAR(10) NOT NULL,
    "maBacLuong" INTEGER NOT NULL,
    "tenBacLuong" VARCHAR(10) NOT NULL,
    "heSoLuong" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "dm_nhom_luong_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dm_vi_tri_viec_lam" (
    "id" SERIAL NOT NULL,
    "ma" VARCHAR(20) NOT NULL,
    "ten" VARCHAR(100) NOT NULL,
    "loaiVtvl" VARCHAR(20),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "dm_vi_tri_viec_lam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tcns_ly_lich" (
    "id" SERIAL NOT NULL,
    "shcc" VARCHAR(255) NOT NULL,
    "maNhanVien" VARCHAR(20) NOT NULL,
    "ho" VARCHAR(150) NOT NULL,
    "ten" VARCHAR(50) NOT NULL,
    "ngaySinh" TIMESTAMP,
    "thanhPhanGiaDinh" VARCHAR(5),
    "thanhPhanBanThan" VARCHAR(5),
    "gioiTinh" VARCHAR(5),
    "danToc" VARCHAR(5),
    "tonGiao" VARCHAR(5),
    "quocTich" VARCHAR(5),
    "emailCaNhan" VARCHAR(70),
    "chieuCao" INTEGER,
    "canNang" INTEGER,
    "nhomMau" VARCHAR(5),
    "ngayNhapNgu" TIMESTAMP,
    "ngayXuatNgu" TIMESTAMP,
    "quanHam" VARCHAR(5),
    "ngayVaoDang" TIMESTAMP,
    "ngayVaoDangCt" TIMESTAMP,
    "ngayVaoDoan" TIMESTAMP,
    "maSoThue" VARCHAR(20),
    "stk" VARCHAR(20),
    "nganHang" VARCHAR(100),
    "email" VARCHAR(70),
    "chiNhanh" VARCHAR(200),
    "biDanh" VARCHAR(100),
    "cccd" VARCHAR(20),
    "sucKhoe" TEXT,
    "isDangVien" BOOLEAN DEFAULT false,
    "ngayVaoCongDoan" TIMESTAMP,
    "bhxh" VARCHAR(20),
    "doiTuongChinhSach" VARCHAR(100),
    "bhyt" VARCHAR(20),
    "ngayCapCccd" TIMESTAMP,
    "noiCapCccd" VARCHAR(5),
    "sdt" VARCHAR(20),
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "tcns_ly_lich_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dm_dt_van_bang_llct_ma_key" ON "dm_dt_van_bang_llct"("ma");

-- CreateIndex
CREATE INDEX "dm_dt_van_bang_llct_ma_idx" ON "dm_dt_van_bang_llct"("ma");

-- CreateIndex
CREATE UNIQUE INDEX "dm_hinh_thuc_ky_luat_ma_key" ON "dm_hinh_thuc_ky_luat"("ma");

-- CreateIndex
CREATE INDEX "dm_hinh_thuc_ky_luat_ma_idx" ON "dm_hinh_thuc_ky_luat"("ma");

-- CreateIndex
CREATE UNIQUE INDEX "dm_loai_can_bo_ma_key" ON "dm_loai_can_bo"("ma");

-- CreateIndex
CREATE INDEX "dm_loai_can_bo_ma_idx" ON "dm_loai_can_bo"("ma");

-- CreateIndex
CREATE UNIQUE INDEX "dm_loai_chuc_vu_ma_key" ON "dm_loai_chuc_vu"("ma");

-- CreateIndex
CREATE INDEX "dm_loai_chuc_vu_ma_idx" ON "dm_loai_chuc_vu"("ma");

-- CreateIndex
CREATE UNIQUE INDEX "dm_loai_phu_cap_ma_key" ON "dm_loai_phu_cap"("ma");

-- CreateIndex
CREATE INDEX "dm_loai_phu_cap_ma_idx" ON "dm_loai_phu_cap"("ma");

-- CreateIndex
CREATE UNIQUE INDEX "dm_ngach_cdnn_ma_key" ON "dm_ngach_cdnn"("ma");

-- CreateIndex
CREATE INDEX "dm_ngach_cdnn_ma_idx" ON "dm_ngach_cdnn"("ma");

-- CreateIndex
CREATE UNIQUE INDEX "dm_ngan_hang_ma_key" ON "dm_ngan_hang"("ma");

-- CreateIndex
CREATE INDEX "dm_ngan_hang_ma_idx" ON "dm_ngan_hang"("ma");

-- CreateIndex
CREATE UNIQUE INDEX "dm_nhom_mau_ma_key" ON "dm_nhom_mau"("ma");

-- CreateIndex
CREATE INDEX "dm_nhom_mau_ma_idx" ON "dm_nhom_mau"("ma");

-- CreateIndex
CREATE UNIQUE INDEX "dm_noi_cap_cccd_ma_key" ON "dm_noi_cap_cccd"("ma");

-- CreateIndex
CREATE INDEX "dm_noi_cap_cccd_ma_idx" ON "dm_noi_cap_cccd"("ma");

-- CreateIndex
CREATE UNIQUE INDEX "dm_quan_ham_ma_key" ON "dm_quan_ham"("ma");

-- CreateIndex
CREATE INDEX "dm_quan_ham_ma_idx" ON "dm_quan_ham"("ma");

-- CreateIndex
CREATE UNIQUE INDEX "dm_quan_he_gia_dinh_ma_key" ON "dm_quan_he_gia_dinh"("ma");

-- CreateIndex
CREATE INDEX "dm_quan_he_gia_dinh_ma_idx" ON "dm_quan_he_gia_dinh"("ma");

-- CreateIndex
CREATE UNIQUE INDEX "dm_quoc_gia_ma_key" ON "dm_quoc_gia"("ma");

-- CreateIndex
CREATE INDEX "dm_quoc_gia_ma_idx" ON "dm_quoc_gia"("ma");

-- CreateIndex
CREATE UNIQUE INDEX "dm_thanh_phan_xuat_than_ma_key" ON "dm_thanh_phan_xuat_than"("ma");

-- CreateIndex
CREATE INDEX "dm_thanh_phan_xuat_than_ma_idx" ON "dm_thanh_phan_xuat_than"("ma");

-- CreateIndex
CREATE UNIQUE INDEX "dm_ton_giao_ma_key" ON "dm_ton_giao"("ma");

-- CreateIndex
CREATE INDEX "dm_ton_giao_ma_idx" ON "dm_ton_giao"("ma");

-- CreateIndex
CREATE UNIQUE INDEX "dm_trinh_do_chuyen_mon_ma_key" ON "dm_trinh_do_chuyen_mon"("ma");

-- CreateIndex
CREATE INDEX "dm_trinh_do_chuyen_mon_ma_idx" ON "dm_trinh_do_chuyen_mon"("ma");

-- CreateIndex
CREATE UNIQUE INDEX "dm_trinh_do_pho_thong_ma_key" ON "dm_trinh_do_pho_thong"("ma");

-- CreateIndex
CREATE INDEX "dm_trinh_do_pho_thong_ma_idx" ON "dm_trinh_do_pho_thong"("ma");

-- CreateIndex
CREATE UNIQUE INDEX "dm_xep_loai_chuyen_mon_ma_key" ON "dm_xep_loai_chuyen_mon"("ma");

-- CreateIndex
CREATE INDEX "dm_xep_loai_chuyen_mon_ma_idx" ON "dm_xep_loai_chuyen_mon"("ma");

-- CreateIndex
CREATE UNIQUE INDEX "dm_nhom_luong_nhomLuong_key" ON "dm_nhom_luong"("nhomLuong");

-- CreateIndex
CREATE INDEX "dm_nhom_luong_nhomLuong_idx" ON "dm_nhom_luong"("nhomLuong");

-- CreateIndex
CREATE UNIQUE INDEX "dm_vi_tri_viec_lam_ma_key" ON "dm_vi_tri_viec_lam"("ma");

-- CreateIndex
CREATE INDEX "dm_vi_tri_viec_lam_ma_idx" ON "dm_vi_tri_viec_lam"("ma");

-- CreateIndex
CREATE UNIQUE INDEX "tcns_ly_lich_shcc_key" ON "tcns_ly_lich"("shcc");

-- CreateIndex
CREATE INDEX "tcns_ly_lich_shcc_idx" ON "tcns_ly_lich"("shcc");

-- CreateIndex
CREATE INDEX "tcns_ly_lich_maNhanVien_idx" ON "tcns_ly_lich"("maNhanVien");
