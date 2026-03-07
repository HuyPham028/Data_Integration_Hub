-- CreateTable
CREATE TABLE "dm_gioi_tinh" (
    "id" SERIAL NOT NULL,
    "ma" VARCHAR(5) NOT NULL,
    "ten" VARCHAR(20) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dm_gioi_tinh_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dm_chau_luc" (
    "id" SERIAL NOT NULL,
    "ma" VARCHAR(10) NOT NULL,
    "ten" VARCHAR(50) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dm_chau_luc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dm_chuc_danh_khoa_hoc" (
    "id" SERIAL NOT NULL,
    "ma" VARCHAR(5) NOT NULL,
    "ten" VARCHAR(50) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dm_chuc_danh_khoa_hoc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dm_chuc_vu" (
    "id" SERIAL NOT NULL,
    "ma" VARCHAR(5) NOT NULL,
    "ten" VARCHAR(200) NOT NULL,
    "heSoPhuCap" DOUBLE PRECISION,
    "prefixText" VARCHAR(50),
    "loaiChucVu" VARCHAR(5),
    "priority" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dm_chuc_vu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dm_chuyen_nganh_bgd" (
    "id" SERIAL NOT NULL,
    "ma" VARCHAR(20) NOT NULL,
    "ten" VARCHAR(200) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dm_chuyen_nganh_bgd_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dm_dan_toc" (
    "id" SERIAL NOT NULL,
    "ma" VARCHAR(5) NOT NULL,
    "ten" VARCHAR(100) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dm_dan_toc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dm_danh_hieu_nha_nuoc" (
    "id" SERIAL NOT NULL,
    "ma" VARCHAR(5) NOT NULL,
    "ten" VARCHAR(200) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dm_danh_hieu_nha_nuoc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dm_doi_tuong_chinh_sach" (
    "id" SERIAL NOT NULL,
    "ma" VARCHAR(5) NOT NULL,
    "ten" VARCHAR(100) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dm_doi_tuong_chinh_sach_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dm_dt_chung_chi_bdnv" (
    "id" SERIAL NOT NULL,
    "ma" VARCHAR(5) NOT NULL,
    "ten" VARCHAR(100) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dm_dt_chung_chi_bdnv_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dm_dt_chung_chi_ngoai_ngu" (
    "id" SERIAL NOT NULL,
    "ma" VARCHAR(20) NOT NULL,
    "ten" VARCHAR(100) NOT NULL,
    "ngoaiNgu" VARCHAR(5),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dm_dt_chung_chi_ngoai_ngu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dm_dt_chung_chi_tin_hoc" (
    "id" SERIAL NOT NULL,
    "ma" VARCHAR(5) NOT NULL,
    "ten" VARCHAR(100) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dm_dt_chung_chi_tin_hoc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dm_dt_doi_tuong_anqp" (
    "id" SERIAL NOT NULL,
    "ma" VARCHAR(5) NOT NULL,
    "ten" VARCHAR(200) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dm_dt_doi_tuong_anqp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dm_dt_hinh_thuc_cm" (
    "id" SERIAL NOT NULL,
    "ma" VARCHAR(5) NOT NULL,
    "ten" VARCHAR(50) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dm_dt_hinh_thuc_cm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dm_dt_hinh_thuc_llct" (
    "id" SERIAL NOT NULL,
    "ma" VARCHAR(5) NOT NULL,
    "ten" VARCHAR(50) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dm_dt_hinh_thuc_llct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dm_dt_ngoai_ngu" (
    "id" SERIAL NOT NULL,
    "ma" VARCHAR(5) NOT NULL,
    "ten" VARCHAR(50) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dm_dt_ngoai_ngu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tcns_can_bo" (
    "id" SERIAL NOT NULL,
    "shcc" VARCHAR(20),
    "ho" VARCHAR(150),
    "ten" VARCHAR(50),
    "ngaySinh" TIMESTAMP,
    "gioiTinh" VARCHAR(5),
    "maNhanVien" VARCHAR(20),
    "email" VARCHAR(70),
    "sdt" VARCHAR(20),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tcns_can_bo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nguoi_hoc" (
    "id" SERIAL NOT NULL,
    "cccdSo" VARCHAR(20),
    "cccdNgayCap" TIMESTAMP(3),
    "cccdNoiCap" VARCHAR(255),
    "ho" VARCHAR(255),
    "ten" VARCHAR(255),
    "ngaySinh" TIMESTAMP(3),
    "noiSinhPhuongXa" VARCHAR(50),
    "emailCaNhan" VARCHAR(255),
    "soDienThoai" VARCHAR(50),
    "gioiTinh" VARCHAR(5),
    "quocTich" VARCHAR(50),
    "tonGiao" VARCHAR(50),
    "danToc" VARCHAR(50),
    "chaHoTen" VARCHAR(255),
    "chaNamSinh" SMALLINT,
    "chaNgheNghiep" VARCHAR(255),
    "chaNoiCongTac" VARCHAR(50),
    "chaDienThoai" VARCHAR(50),
    "meHoTen" VARCHAR(255),
    "meNamSinh" SMALLINT,
    "meNgheNghiep" VARCHAR(255),
    "meNoiCongTac" VARCHAR(50),
    "meDienThoai" VARCHAR(50),
    "nguoiLienHeHoTen" VARCHAR(255),
    "nguoiLienHePhuongXa" VARCHAR(50),
    "nguoiLienHeSoNha" VARCHAR(255),
    "nguoiLienHeDienThoai" VARCHAR(50),
    "lienLacSoNhaDuong" VARCHAR(255),
    "lienLacPhuongXa" VARCHAR(50),
    "thuongTruSoNhaDuong" VARCHAR(255),
    "thuongTruPhuongXa" VARCHAR(50),
    "thuongTruQuocGia" VARCHAR(50),
    "doanNgayVao" TIMESTAMP(3),
    "dangNgayVao" TIMESTAMP(3),
    "bhytSoThe" VARCHAR(255),
    "bhtnSoThe" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nguoi_hoc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nh_dao_tao" (
    "id" SERIAL NOT NULL,
    "cccdSo" VARCHAR(20),
    "maNguoiHoc" VARCHAR(20),
    "trinhDoDaoTao" VARCHAR(50),
    "emailTruong" VARCHAR(50),
    "maTuyenSinh" VARCHAR(50),
    "tsMaNganh" VARCHAR(20),
    "doiTuongUuTien" VARCHAR(50),
    "khuVucTuyenSinh" VARCHAR(50),
    "truongThpt" VARCHAR(50),
    "trungTuyenSoQd" VARCHAR(50),
    "trungTuyenNgayQd" TIMESTAMP(3),
    "trungTuyenToHopMon" VARCHAR(50),
    "diemMon1" VARCHAR(10),
    "diemMon2" VARCHAR(10),
    "diemMon3" VARCHAR(10),
    "diemUuTien" VARCHAR(10),
    "tongDiemXetTuyen" VARCHAR(10),
    "dtMaCtdt" VARCHAR(50),
    "dtMaNganh" VARCHAR(50),
    "loaiHinhDaoTao" VARCHAR(50),
    "heDaoTao" VARCHAR(50),
    "buoiDaoTao" VARCHAR(50),
    "thangVao" SMALLINT,
    "namVao" SMALLINT,
    "namRa" SMALLINT,
    "maLop" VARCHAR(50),
    "khoa" VARCHAR(50),
    "donViQuanLy" VARCHAR(50),
    "coSoDaoTao" VARCHAR(50),
    "hkGiaHan" SMALLINT,
    "ngayNhapHoc" TIMESTAMP(3),
    "trangThaiNguoiHoc" VARCHAR(50),
    "ngayChuyenTrangThai" TIMESTAMP(3),
    "qlctdtCtdt" VARCHAR(255),
    "nguoiHocId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nh_dao_tao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nh_van_bang" (
    "id" SERIAL NOT NULL,
    "maNguoiHoc" VARCHAR(20),
    "cccdSo" VARCHAR(20),
    "maCtdt" VARCHAR(50),
    "maNganh" VARCHAR(50),
    "tnSoQd" VARCHAR(50),
    "tnNgayQd" TIMESTAMP(3),
    "tnXepLoai" VARCHAR(50),
    "vbNgayCap" TIMESTAMP(3),
    "vbSoHieu" VARCHAR(50),
    "vbSoVaoSoGoc" VARCHAR(50),
    "nhDaoTaoId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nh_van_bang_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nh_vi_pham_ky_luat" (
    "id" SERIAL NOT NULL,
    "maNguoiHoc" VARCHAR(20),
    "cccdSo" VARCHAR(20),
    "loaiViPham" VARCHAR(50),
    "hinhThucXuLy" VARCHAR(255),
    "noiDungLyDo" VARCHAR(500),
    "loaiKyLuat" VARCHAR(50),
    "soQd" VARCHAR(50),
    "ngayQd" TIMESTAMP(3),
    "namHocHocKy" SMALLINT,
    "nhDaoTaoId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nh_vi_pham_ky_luat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dm_gioi_tinh_ma_key" ON "dm_gioi_tinh"("ma");

-- CreateIndex
CREATE INDEX "dm_gioi_tinh_ma_idx" ON "dm_gioi_tinh"("ma");

-- CreateIndex
CREATE UNIQUE INDEX "dm_chau_luc_ma_key" ON "dm_chau_luc"("ma");

-- CreateIndex
CREATE INDEX "dm_chau_luc_ma_idx" ON "dm_chau_luc"("ma");

-- CreateIndex
CREATE UNIQUE INDEX "dm_chuc_danh_khoa_hoc_ma_key" ON "dm_chuc_danh_khoa_hoc"("ma");

-- CreateIndex
CREATE INDEX "dm_chuc_danh_khoa_hoc_ma_idx" ON "dm_chuc_danh_khoa_hoc"("ma");

-- CreateIndex
CREATE UNIQUE INDEX "dm_chuc_vu_ma_key" ON "dm_chuc_vu"("ma");

-- CreateIndex
CREATE INDEX "dm_chuc_vu_ma_idx" ON "dm_chuc_vu"("ma");

-- CreateIndex
CREATE UNIQUE INDEX "dm_chuyen_nganh_bgd_ma_key" ON "dm_chuyen_nganh_bgd"("ma");

-- CreateIndex
CREATE INDEX "dm_chuyen_nganh_bgd_ma_idx" ON "dm_chuyen_nganh_bgd"("ma");

-- CreateIndex
CREATE UNIQUE INDEX "dm_dan_toc_ma_key" ON "dm_dan_toc"("ma");

-- CreateIndex
CREATE INDEX "dm_dan_toc_ma_idx" ON "dm_dan_toc"("ma");

-- CreateIndex
CREATE UNIQUE INDEX "dm_danh_hieu_nha_nuoc_ma_key" ON "dm_danh_hieu_nha_nuoc"("ma");

-- CreateIndex
CREATE INDEX "dm_danh_hieu_nha_nuoc_ma_idx" ON "dm_danh_hieu_nha_nuoc"("ma");

-- CreateIndex
CREATE UNIQUE INDEX "dm_doi_tuong_chinh_sach_ma_key" ON "dm_doi_tuong_chinh_sach"("ma");

-- CreateIndex
CREATE INDEX "dm_doi_tuong_chinh_sach_ma_idx" ON "dm_doi_tuong_chinh_sach"("ma");

-- CreateIndex
CREATE UNIQUE INDEX "dm_dt_chung_chi_bdnv_ma_key" ON "dm_dt_chung_chi_bdnv"("ma");

-- CreateIndex
CREATE INDEX "dm_dt_chung_chi_bdnv_ma_idx" ON "dm_dt_chung_chi_bdnv"("ma");

-- CreateIndex
CREATE UNIQUE INDEX "dm_dt_chung_chi_ngoai_ngu_ma_key" ON "dm_dt_chung_chi_ngoai_ngu"("ma");

-- CreateIndex
CREATE INDEX "dm_dt_chung_chi_ngoai_ngu_ma_idx" ON "dm_dt_chung_chi_ngoai_ngu"("ma");

-- CreateIndex
CREATE UNIQUE INDEX "dm_dt_chung_chi_tin_hoc_ma_key" ON "dm_dt_chung_chi_tin_hoc"("ma");

-- CreateIndex
CREATE INDEX "dm_dt_chung_chi_tin_hoc_ma_idx" ON "dm_dt_chung_chi_tin_hoc"("ma");

-- CreateIndex
CREATE UNIQUE INDEX "dm_dt_doi_tuong_anqp_ma_key" ON "dm_dt_doi_tuong_anqp"("ma");

-- CreateIndex
CREATE INDEX "dm_dt_doi_tuong_anqp_ma_idx" ON "dm_dt_doi_tuong_anqp"("ma");

-- CreateIndex
CREATE UNIQUE INDEX "dm_dt_hinh_thuc_cm_ma_key" ON "dm_dt_hinh_thuc_cm"("ma");

-- CreateIndex
CREATE INDEX "dm_dt_hinh_thuc_cm_ma_idx" ON "dm_dt_hinh_thuc_cm"("ma");

-- CreateIndex
CREATE UNIQUE INDEX "dm_dt_hinh_thuc_llct_ma_key" ON "dm_dt_hinh_thuc_llct"("ma");

-- CreateIndex
CREATE INDEX "dm_dt_hinh_thuc_llct_ma_idx" ON "dm_dt_hinh_thuc_llct"("ma");

-- CreateIndex
CREATE UNIQUE INDEX "dm_dt_ngoai_ngu_ma_key" ON "dm_dt_ngoai_ngu"("ma");

-- CreateIndex
CREATE INDEX "dm_dt_ngoai_ngu_ma_idx" ON "dm_dt_ngoai_ngu"("ma");

-- CreateIndex
CREATE UNIQUE INDEX "tcns_can_bo_shcc_key" ON "tcns_can_bo"("shcc");

-- CreateIndex
CREATE UNIQUE INDEX "nguoi_hoc_cccdSo_key" ON "nguoi_hoc"("cccdSo");

-- CreateIndex
CREATE INDEX "nh_dao_tao_maNguoiHoc_idx" ON "nh_dao_tao"("maNguoiHoc");

-- AddForeignKey
ALTER TABLE "nh_dao_tao" ADD CONSTRAINT "nh_dao_tao_nguoiHocId_fkey" FOREIGN KEY ("nguoiHocId") REFERENCES "nguoi_hoc"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nh_van_bang" ADD CONSTRAINT "nh_van_bang_nhDaoTaoId_fkey" FOREIGN KEY ("nhDaoTaoId") REFERENCES "nh_dao_tao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nh_vi_pham_ky_luat" ADD CONSTRAINT "nh_vi_pham_ky_luat_nhDaoTaoId_fkey" FOREIGN KEY ("nhDaoTaoId") REFERENCES "nh_dao_tao"("id") ON DELETE SET NULL ON UPDATE CASCADE;
