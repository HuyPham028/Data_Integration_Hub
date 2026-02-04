import {
  IsString,
  IsOptional,
  IsDate,
  IsNumber,
  IsBoolean,
  MaxLength,
  IsEmail,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Create DTO cho tcns_ly_lich
 */
export class CreateTcnsLyLichDto {
  @IsString()
  @MaxLength(255)
  shcc: string;

  @IsString()
  @MaxLength(20)
  maNhanVien: string;

  @IsString()
  @MaxLength(150)
  ho: string;

  @IsString()
  @MaxLength(50)
  ten: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  ngaySinh?: Date;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  thanhPhanGiaDinh?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  thanhPhanBanThan?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  gioiTinh?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  danToc?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  tonGiao?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  quocTich?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(70)
  emailCaNhan?: string;

  @IsOptional()
  @IsNumber()
  chieuCao?: number;

  @IsOptional()
  @IsNumber()
  canNang?: number;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  nhomMau?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  ngayNhapNgu?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  ngayXuatNgu?: Date;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  quanHam?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  ngayVaoDang?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  ngayVaoDangCt?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  ngayVaoDoan?: Date;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  maSoThue?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  stk?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nganHang?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(70)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  chiNhanh?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  biDanh?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  cccd?: string;

  @IsOptional()
  @IsString()
  sucKhoe?: string;

  @IsOptional()
  @IsBoolean()
  isDangVien?: boolean;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  ngayVaoCongDoan?: Date;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  bhxh?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  doiTuongChinhSach?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  bhyt?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  ngayCapCccd?: Date;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  noiCapCccd?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  sdt?: string;
}

/**
 * Update DTO cho tcns_ly_lich
 */
export class UpdateTcnsLyLichDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  shcc?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  maNhanVien?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  ho?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  ten?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  ngaySinh?: Date;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  thanhPhanGiaDinh?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  thanhPhanBanThan?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  gioiTinh?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  danToc?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  tonGiao?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  quocTich?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(70)
  emailCaNhan?: string;

  @IsOptional()
  @IsNumber()
  chieuCao?: number;

  @IsOptional()
  @IsNumber()
  canNang?: number;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  nhomMau?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  ngayNhapNgu?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  ngayXuatNgu?: Date;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  quanHam?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  ngayVaoDang?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  ngayVaoDangCt?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  ngayVaoDoan?: Date;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  maSoThue?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  stk?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nganHang?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(70)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  chiNhanh?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  biDanh?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  cccd?: string;

  @IsOptional()
  @IsString()
  sucKhoe?: string;

  @IsOptional()
  @IsBoolean()
  isDangVien?: boolean;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  ngayVaoCongDoan?: Date;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  bhxh?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  doiTuongChinhSach?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  bhyt?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  ngayCapCccd?: Date;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  noiCapCccd?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  sdt?: string;
}
