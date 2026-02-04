import {
  IsString,
  IsBoolean,
  IsOptional,
  MaxLength,
  IsNumber,
  IsDecimal,
} from 'class-validator';

/**
 * Base DTO cho các bảng dữ liệu tham chiếu
 */
export class BaseDMDTO {
  @IsString()
  @MaxLength(5)
  ma: string;

  @IsString()
  @MaxLength(100)
  ten: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

/**
 * Create DTO cho dm_dt_van_bang_llct
 */
export class CreateDmDtVanBangLLCTDto {
  @IsString()
  @MaxLength(5)
  ma: string;

  @IsString()
  @MaxLength(100)
  ten: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

/**
 * Update DTO cho dm_dt_van_bang_llct
 */
export class UpdateDmDtVanBangLLCTDto {
  @IsOptional()
  @IsString()
  @MaxLength(5)
  ma?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ten?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

/**
 * Create DTO cho dm_hinh_thuc_ky_luat
 */
export class CreateDmHinhThucKyLuatDto {
  @IsString()
  @MaxLength(50)
  ma: string;

  @IsString()
  @MaxLength(500)
  ten: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

/**
 * Update DTO cho dm_hinh_thuc_ky_luat
 */
export class UpdateDmHinhThucKyLuatDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  ma?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  ten?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

/**
 * Create DTO cho dm_loai_can_bo
 */
export class CreateDmLoaiCanBoDto {
  @IsString()
  @MaxLength(5)
  ma: string;

  @IsString()
  @MaxLength(50)
  ten: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

/**
 * Update DTO cho dm_loai_can_bo
 */
export class UpdateDmLoaiCanBoDto {
  @IsOptional()
  @IsString()
  @MaxLength(5)
  ma?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  ten?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

/**
 * Create DTO cho dm_loai_chuc_vu
 */
export class CreateDmLoaiChucVuDto {
  @IsString()
  @MaxLength(5)
  ma: string;

  @IsString()
  @MaxLength(70)
  ten: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

/**
 * Update DTO cho dm_loai_chuc_vu
 */
export class UpdateDmLoaiChucVuDto {
  @IsOptional()
  @IsString()
  @MaxLength(5)
  ma?: string;

  @IsOptional()
  @IsString()
  @MaxLength(70)
  ten?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

/**
 * Create DTO cho dm_loai_phu_cap
 */
export class CreateDmLoaiPhuCapDto {
  @IsString()
  @MaxLength(10)
  ma: string;

  @IsString()
  @MaxLength(100)
  ten: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

/**
 * Update DTO cho dm_loai_phu_cap
 */
export class UpdateDmLoaiPhuCapDto {
  @IsOptional()
  @IsString()
  @MaxLength(10)
  ma?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ten?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

/**
 * Create DTO cho dm_ngach_cdnn
 */
export class CreateDmNgachCDNNDto {
  @IsString()
  @MaxLength(20)
  ma: string;

  @IsString()
  @MaxLength(100)
  ten: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

/**
 * Update DTO cho dm_ngach_cdnn
 */
export class UpdateDmNgachCDNNDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  ma?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ten?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

/**
 * Create DTO cho dm_ngan_hang
 */
export class CreateDmNganHangDto {
  @IsString()
  @MaxLength(20)
  ma: string;

  @IsString()
  @MaxLength(200)
  ten: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

/**
 * Update DTO cho dm_ngan_hang
 */
export class UpdateDmNganHangDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  ma?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  ten?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

/**
 * Create DTO cho dm_nhom_mau
 */
export class CreateDmNhomMauDto {
  @IsString()
  @MaxLength(5)
  ma: string;

  @IsString()
  @MaxLength(50)
  ten: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

/**
 * Update DTO cho dm_nhom_mau
 */
export class UpdateDmNhomMauDto {
  @IsOptional()
  @IsString()
  @MaxLength(5)
  ma?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  ten?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

/**
 * Create DTO cho dm_noi_cap_cccd
 */
export class CreateDmNoiCapCCCDDto {
  @IsString()
  @MaxLength(10)
  ma: string;

  @IsString()
  @MaxLength(100)
  ten: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

/**
 * Update DTO cho dm_noi_cap_cccd
 */
export class UpdateDmNoiCapCCCDDto {
  @IsOptional()
  @IsString()
  @MaxLength(10)
  ma?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ten?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

/**
 * Create DTO cho dm_quan_ham
 */
export class CreateDmQuanHamDto {
  @IsString()
  @MaxLength(10)
  ma: string;

  @IsString()
  @MaxLength(50)
  ten: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

/**
 * Update DTO cho dm_quan_ham
 */
export class UpdateDmQuanHamDto {
  @IsOptional()
  @IsString()
  @MaxLength(10)
  ma?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  ten?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

/**
 * Create DTO cho dm_quan_he_gia_dinh
 */
export class CreateDmQuanHeGiaDinhDto {
  @IsString()
  @MaxLength(5)
  ma: string;

  @IsString()
  @MaxLength(50)
  ten: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

/**
 * Update DTO cho dm_quan_he_gia_dinh
 */
export class UpdateDmQuanHeGiaDinhDto {
  @IsOptional()
  @IsString()
  @MaxLength(5)
  ma?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  ten?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

/**
 * Create DTO cho dm_quoc_gia
 */
export class CreateDmQuocGiaDto {
  @IsString()
  @MaxLength(5)
  ma: string;

  @IsString()
  @MaxLength(100)
  ten: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  maChauLuc?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

/**
 * Update DTO cho dm_quoc_gia
 */
export class UpdateDmQuocGiaDto {
  @IsOptional()
  @IsString()
  @MaxLength(5)
  ma?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ten?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  maChauLuc?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

/**
 * Create DTO cho dm_thanh_phan_xuat_than
 */
export class CreateDmThanhPhanXuatThanDto {
  @IsString()
  @MaxLength(10)
  ma: string;

  @IsString()
  @MaxLength(100)
  ten: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

/**
 * Update DTO cho dm_thanh_phan_xuat_than
 */
export class UpdateDmThanhPhanXuatThanDto {
  @IsOptional()
  @IsString()
  @MaxLength(10)
  ma?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ten?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

/**
 * Create DTO cho dm_ton_giao
 */
export class CreateDmTonGiaoDto {
  @IsString()
  @MaxLength(5)
  ma: string;

  @IsString()
  @MaxLength(100)
  ten: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

/**
 * Update DTO cho dm_ton_giao
 */
export class UpdateDmTonGiaoDto {
  @IsOptional()
  @IsString()
  @MaxLength(5)
  ma?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ten?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

/**
 * Create DTO cho dm_trinh_do_chuyen_mon
 */
export class CreateDmTrinhDoChuyenMonDto {
  @IsString()
  @MaxLength(5)
  ma: string;

  @IsString()
  @MaxLength(50)
  ten: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

/**
 * Update DTO cho dm_trinh_do_chuyen_mon
 */
export class UpdateDmTrinhDoChuyenMonDto {
  @IsOptional()
  @IsString()
  @MaxLength(5)
  ma?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  ten?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

/**
 * Create DTO cho dm_trinh_do_pho_thong
 */
export class CreateDmTrinhDoPhoThongDto {
  @IsString()
  @MaxLength(5)
  ma: string;

  @IsString()
  @MaxLength(50)
  ten: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

/**
 * Update DTO cho dm_trinh_do_pho_thong
 */
export class UpdateDmTrinhDoPhoThongDto {
  @IsOptional()
  @IsString()
  @MaxLength(5)
  ma?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  ten?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

/**
 * Create DTO cho dm_xep_loai_chuyen_mon
 */
export class CreateDmXepLoaiChuyenMonDto {
  @IsString()
  @MaxLength(50)
  ma: string;

  @IsString()
  @MaxLength(500)
  ten: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

/**
 * Update DTO cho dm_xep_loai_chuyen_mon
 */
export class UpdateDmXepLoaiChuyenMonDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  ma?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  ten?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

/**
 * Create DTO cho dm_nhom_luong
 */
export class CreateDmNhomLuongDto {
  @IsString()
  @MaxLength(10)
  nhomLuong: string;

  @IsNumber()
  maBacLuong: number;

  @IsString()
  @MaxLength(10)
  tenBacLuong: string;

  @IsDecimal()
  heSoLuong: number;
}

/**
 * Update DTO cho dm_nhom_luong
 */
export class UpdateDmNhomLuongDto {
  @IsOptional()
  @IsString()
  @MaxLength(10)
  nhomLuong?: string;

  @IsOptional()
  @IsNumber()
  maBacLuong?: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  tenBacLuong?: string;

  @IsOptional()
  @IsDecimal()
  heSoLuong?: number;
}

/**
 * Create DTO cho dm_vi_tri_viec_lam
 */
export class CreateDmViTriViecLamDto {
  @IsString()
  @MaxLength(20)
  ma: string;

  @IsString()
  @MaxLength(100)
  ten: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  loaiVtvl?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

/**
 * Update DTO cho dm_vi_tri_viec_lam
 */
export class UpdateDmViTriViecLamDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  ma?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ten?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  loaiVtvl?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
