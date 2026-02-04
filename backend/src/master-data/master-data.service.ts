import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateDmDtVanBangLLCTDto,
  UpdateDmDtVanBangLLCTDto,
  CreateDmHinhThucKyLuatDto,
  UpdateDmHinhThucKyLuatDto,
  CreateDmLoaiCanBoDto,
  UpdateDmLoaiCanBoDto,
  CreateDmLoaiChucVuDto,
  UpdateDmLoaiChucVuDto,
  CreateDmLoaiPhuCapDto,
  UpdateDmLoaiPhuCapDto,
  CreateDmNgachCDNNDto,
  UpdateDmNgachCDNNDto,
  CreateDmNganHangDto,
  UpdateDmNganHangDto,
  CreateDmNhomMauDto,
  UpdateDmNhomMauDto,
  CreateDmNoiCapCCCDDto,
  UpdateDmNoiCapCCCDDto,
  CreateDmQuanHamDto,
  UpdateDmQuanHamDto,
  CreateDmQuanHeGiaDinhDto,
  UpdateDmQuanHeGiaDinhDto,
  CreateDmQuocGiaDto,
  UpdateDmQuocGiaDto,
  CreateDmThanhPhanXuatThanDto,
  UpdateDmThanhPhanXuatThanDto,
  CreateDmTonGiaoDto,
  UpdateDmTonGiaoDto,
  CreateDmTrinhDoChuyenMonDto,
  UpdateDmTrinhDoChuyenMonDto,
  CreateDmTrinhDoPhoThongDto,
  UpdateDmTrinhDoPhoThongDto,
  CreateDmXepLoaiChuyenMonDto,
  UpdateDmXepLoaiChuyenMonDto,
  CreateDmNhomLuongDto,
  UpdateDmNhomLuongDto,
  CreateDmViTriViecLamDto,
  UpdateDmViTriViecLamDto,
} from './dto/master-data.dto';

@Injectable()
export class MasterDataService {
  constructor(private prisma: PrismaService) {}

  // ============= DmDtVanBangLLCT Methods =============
  async createDmDtVanBangLLCT(dto: CreateDmDtVanBangLLCTDto) {
    return this.prisma.dmDtVanBangLLCT.create({ data: dto });
  }

  async findAllDmDtVanBangLLCT() {
    return this.prisma.dmDtVanBangLLCT.findMany();
  }

  async findOneDmDtVanBangLLCT(id: number) {
    return this.prisma.dmDtVanBangLLCT.findUnique({ where: { id } });
  }

  async updateDmDtVanBangLLCT(id: number, dto: UpdateDmDtVanBangLLCTDto) {
    return this.prisma.dmDtVanBangLLCT.update({ where: { id }, data: dto });
  }

  async removeDmDtVanBangLLCT(id: number) {
    return this.prisma.dmDtVanBangLLCT.delete({ where: { id } });
  }

  // ============= DmHinhThucKyLuat Methods =============
  async createDmHinhThucKyLuat(dto: CreateDmHinhThucKyLuatDto) {
    return this.prisma.dmHinhThucKyLuat.create({ data: dto });
  }

  async findAllDmHinhThucKyLuat() {
    return this.prisma.dmHinhThucKyLuat.findMany();
  }

  async findOneDmHinhThucKyLuat(id: number) {
    return this.prisma.dmHinhThucKyLuat.findUnique({ where: { id } });
  }

  async updateDmHinhThucKyLuat(id: number, dto: UpdateDmHinhThucKyLuatDto) {
    return this.prisma.dmHinhThucKyLuat.update({ where: { id }, data: dto });
  }

  async removeDmHinhThucKyLuat(id: number) {
    return this.prisma.dmHinhThucKyLuat.delete({ where: { id } });
  }

  // ============= DmLoaiCanBo Methods =============
  async createDmLoaiCanBo(dto: CreateDmLoaiCanBoDto) {
    return this.prisma.dmLoaiCanBo.create({ data: dto });
  }

  async findAllDmLoaiCanBo() {
    return this.prisma.dmLoaiCanBo.findMany();
  }

  async findOneDmLoaiCanBo(id: number) {
    return this.prisma.dmLoaiCanBo.findUnique({ where: { id } });
  }

  async updateDmLoaiCanBo(id: number, dto: UpdateDmLoaiCanBoDto) {
    return this.prisma.dmLoaiCanBo.update({ where: { id }, data: dto });
  }

  async removeDmLoaiCanBo(id: number) {
    return this.prisma.dmLoaiCanBo.delete({ where: { id } });
  }

  // ============= DmLoaiChucVu Methods =============
  async createDmLoaiChucVu(dto: CreateDmLoaiChucVuDto) {
    return this.prisma.dmLoaiChucVu.create({ data: dto });
  }

  async findAllDmLoaiChucVu() {
    return this.prisma.dmLoaiChucVu.findMany();
  }

  async findOneDmLoaiChucVu(id: number) {
    return this.prisma.dmLoaiChucVu.findUnique({ where: { id } });
  }

  async updateDmLoaiChucVu(id: number, dto: UpdateDmLoaiChucVuDto) {
    return this.prisma.dmLoaiChucVu.update({ where: { id }, data: dto });
  }

  async removeDmLoaiChucVu(id: number) {
    return this.prisma.dmLoaiChucVu.delete({ where: { id } });
  }

  // ============= DmLoaiPhuCap Methods =============
  async createDmLoaiPhuCap(dto: CreateDmLoaiPhuCapDto) {
    return this.prisma.dmLoaiPhuCap.create({ data: dto });
  }

  async findAllDmLoaiPhuCap() {
    return this.prisma.dmLoaiPhuCap.findMany();
  }

  async findOneDmLoaiPhuCap(id: number) {
    return this.prisma.dmLoaiPhuCap.findUnique({ where: { id } });
  }

  async updateDmLoaiPhuCap(id: number, dto: UpdateDmLoaiPhuCapDto) {
    return this.prisma.dmLoaiPhuCap.update({ where: { id }, data: dto });
  }

  async removeDmLoaiPhuCap(id: number) {
    return this.prisma.dmLoaiPhuCap.delete({ where: { id } });
  }

  // ============= DmNgachCDNN Methods =============
  async createDmNgachCDNN(dto: CreateDmNgachCDNNDto) {
    return this.prisma.dmNgachCDNN.create({ data: dto });
  }

  async findAllDmNgachCDNN() {
    return this.prisma.dmNgachCDNN.findMany();
  }

  async findOneDmNgachCDNN(id: number) {
    return this.prisma.dmNgachCDNN.findUnique({ where: { id } });
  }

  async updateDmNgachCDNN(id: number, dto: UpdateDmNgachCDNNDto) {
    return this.prisma.dmNgachCDNN.update({ where: { id }, data: dto });
  }

  async removeDmNgachCDNN(id: number) {
    return this.prisma.dmNgachCDNN.delete({ where: { id } });
  }

  // ============= DmNganHang Methods =============
  async createDmNganHang(dto: CreateDmNganHangDto) {
    return this.prisma.dmNganHang.create({ data: dto });
  }

  async findAllDmNganHang() {
    return this.prisma.dmNganHang.findMany();
  }

  async findOneDmNganHang(id: number) {
    return this.prisma.dmNganHang.findUnique({ where: { id } });
  }

  async updateDmNganHang(id: number, dto: UpdateDmNganHangDto) {
    return this.prisma.dmNganHang.update({ where: { id }, data: dto });
  }

  async removeDmNganHang(id: number) {
    return this.prisma.dmNganHang.delete({ where: { id } });
  }

  // ============= DmNhomMau Methods =============
  async createDmNhomMau(dto: CreateDmNhomMauDto) {
    return this.prisma.dmNhomMau.create({ data: dto });
  }

  async findAllDmNhomMau() {
    return this.prisma.dmNhomMau.findMany();
  }

  async findOneDmNhomMau(id: number) {
    return this.prisma.dmNhomMau.findUnique({ where: { id } });
  }

  async updateDmNhomMau(id: number, dto: UpdateDmNhomMauDto) {
    return this.prisma.dmNhomMau.update({ where: { id }, data: dto });
  }

  async removeDmNhomMau(id: number) {
    return this.prisma.dmNhomMau.delete({ where: { id } });
  }

  // ============= DmNoiCapCCCD Methods =============
  async createDmNoiCapCCCD(dto: CreateDmNoiCapCCCDDto) {
    return this.prisma.dmNoiCapCCCD.create({ data: dto });
  }

  async findAllDmNoiCapCCCD() {
    return this.prisma.dmNoiCapCCCD.findMany();
  }

  async findOneDmNoiCapCCCD(id: number) {
    return this.prisma.dmNoiCapCCCD.findUnique({ where: { id } });
  }

  async updateDmNoiCapCCCD(id: number, dto: UpdateDmNoiCapCCCDDto) {
    return this.prisma.dmNoiCapCCCD.update({ where: { id }, data: dto });
  }

  async removeDmNoiCapCCCD(id: number) {
    return this.prisma.dmNoiCapCCCD.delete({ where: { id } });
  }

  // ============= DmQuanHam Methods =============
  async createDmQuanHam(dto: CreateDmQuanHamDto) {
    return this.prisma.dmQuanHam.create({ data: dto });
  }

  async findAllDmQuanHam() {
    return this.prisma.dmQuanHam.findMany();
  }

  async findOneDmQuanHam(id: number) {
    return this.prisma.dmQuanHam.findUnique({ where: { id } });
  }

  async updateDmQuanHam(id: number, dto: UpdateDmQuanHamDto) {
    return this.prisma.dmQuanHam.update({ where: { id }, data: dto });
  }

  async removeDmQuanHam(id: number) {
    return this.prisma.dmQuanHam.delete({ where: { id } });
  }

  // ============= DmQuanHeGiaDinh Methods =============
  async createDmQuanHeGiaDinh(dto: CreateDmQuanHeGiaDinhDto) {
    return this.prisma.dmQuanHeGiaDinh.create({ data: dto });
  }

  async findAllDmQuanHeGiaDinh() {
    return this.prisma.dmQuanHeGiaDinh.findMany();
  }

  async findOneDmQuanHeGiaDinh(id: number) {
    return this.prisma.dmQuanHeGiaDinh.findUnique({ where: { id } });
  }

  async updateDmQuanHeGiaDinh(id: number, dto: UpdateDmQuanHeGiaDinhDto) {
    return this.prisma.dmQuanHeGiaDinh.update({ where: { id }, data: dto });
  }

  async removeDmQuanHeGiaDinh(id: number) {
    return this.prisma.dmQuanHeGiaDinh.delete({ where: { id } });
  }

  // ============= DmQuocGia Methods =============
  async createDmQuocGia(dto: CreateDmQuocGiaDto) {
    return this.prisma.dmQuocGia.create({ data: dto });
  }

  async findAllDmQuocGia() {
    return this.prisma.dmQuocGia.findMany();
  }

  async findOneDmQuocGia(id: number) {
    return this.prisma.dmQuocGia.findUnique({ where: { id } });
  }

  async updateDmQuocGia(id: number, dto: UpdateDmQuocGiaDto) {
    return this.prisma.dmQuocGia.update({ where: { id }, data: dto });
  }

  async removeDmQuocGia(id: number) {
    return this.prisma.dmQuocGia.delete({ where: { id } });
  }

  // ============= DmThanhPhanXuatThan Methods =============
  async createDmThanhPhanXuatThan(dto: CreateDmThanhPhanXuatThanDto) {
    return this.prisma.dmThanhPhanXuatThan.create({ data: dto });
  }

  async findAllDmThanhPhanXuatThan() {
    return this.prisma.dmThanhPhanXuatThan.findMany();
  }

  async findOneDmThanhPhanXuatThan(id: number) {
    return this.prisma.dmThanhPhanXuatThan.findUnique({ where: { id } });
  }

  async updateDmThanhPhanXuatThan(
    id: number,
    dto: UpdateDmThanhPhanXuatThanDto,
  ) {
    return this.prisma.dmThanhPhanXuatThan.update({ where: { id }, data: dto });
  }

  async removeDmThanhPhanXuatThan(id: number) {
    return this.prisma.dmThanhPhanXuatThan.delete({ where: { id } });
  }

  // ============= DmTonGiao Methods =============
  async createDmTonGiao(dto: CreateDmTonGiaoDto) {
    return this.prisma.dmTonGiao.create({ data: dto });
  }

  async findAllDmTonGiao() {
    return this.prisma.dmTonGiao.findMany();
  }

  async findOneDmTonGiao(id: number) {
    return this.prisma.dmTonGiao.findUnique({ where: { id } });
  }

  async updateDmTonGiao(id: number, dto: UpdateDmTonGiaoDto) {
    return this.prisma.dmTonGiao.update({ where: { id }, data: dto });
  }

  async removeDmTonGiao(id: number) {
    return this.prisma.dmTonGiao.delete({ where: { id } });
  }

  // ============= DmTrinhDoChuyenMon Methods =============
  async createDmTrinhDoChuyenMon(dto: CreateDmTrinhDoChuyenMonDto) {
    return this.prisma.dmTrinhDoChuyenMon.create({ data: dto });
  }

  async findAllDmTrinhDoChuyenMon() {
    return this.prisma.dmTrinhDoChuyenMon.findMany();
  }

  async findOneDmTrinhDoChuyenMon(id: number) {
    return this.prisma.dmTrinhDoChuyenMon.findUnique({ where: { id } });
  }

  async updateDmTrinhDoChuyenMon(id: number, dto: UpdateDmTrinhDoChuyenMonDto) {
    return this.prisma.dmTrinhDoChuyenMon.update({ where: { id }, data: dto });
  }

  async removeDmTrinhDoChuyenMon(id: number) {
    return this.prisma.dmTrinhDoChuyenMon.delete({ where: { id } });
  }

  // ============= DmTrinhDoPhoThong Methods =============
  async createDmTrinhDoPhoThong(dto: CreateDmTrinhDoPhoThongDto) {
    return this.prisma.dmTrinhDoPhoThong.create({ data: dto });
  }

  async findAllDmTrinhDoPhoThong() {
    return this.prisma.dmTrinhDoPhoThong.findMany();
  }

  async findOneDmTrinhDoPhoThong(id: number) {
    return this.prisma.dmTrinhDoPhoThong.findUnique({ where: { id } });
  }

  async updateDmTrinhDoPhoThong(id: number, dto: UpdateDmTrinhDoPhoThongDto) {
    return this.prisma.dmTrinhDoPhoThong.update({ where: { id }, data: dto });
  }

  async removeDmTrinhDoPhoThong(id: number) {
    return this.prisma.dmTrinhDoPhoThong.delete({ where: { id } });
  }

  // ============= DmXepLoaiChuyenMon Methods =============
  async createDmXepLoaiChuyenMon(dto: CreateDmXepLoaiChuyenMonDto) {
    return this.prisma.dmXepLoaiChuyenMon.create({ data: dto });
  }

  async findAllDmXepLoaiChuyenMon() {
    return this.prisma.dmXepLoaiChuyenMon.findMany();
  }

  async findOneDmXepLoaiChuyenMon(id: number) {
    return this.prisma.dmXepLoaiChuyenMon.findUnique({ where: { id } });
  }

  async updateDmXepLoaiChuyenMon(id: number, dto: UpdateDmXepLoaiChuyenMonDto) {
    return this.prisma.dmXepLoaiChuyenMon.update({ where: { id }, data: dto });
  }

  async removeDmXepLoaiChuyenMon(id: number) {
    return this.prisma.dmXepLoaiChuyenMon.delete({ where: { id } });
  }

  // ============= DmNhomLuong Methods =============
  async createDmNhomLuong(dto: CreateDmNhomLuongDto) {
    return this.prisma.dmNhomLuong.create({ data: dto });
  }

  async findAllDmNhomLuong() {
    return this.prisma.dmNhomLuong.findMany();
  }

  async findOneDmNhomLuong(id: number) {
    return this.prisma.dmNhomLuong.findUnique({ where: { id } });
  }

  async updateDmNhomLuong(id: number, dto: UpdateDmNhomLuongDto) {
    return this.prisma.dmNhomLuong.update({ where: { id }, data: dto });
  }

  async removeDmNhomLuong(id: number) {
    return this.prisma.dmNhomLuong.delete({ where: { id } });
  }

  // ============= DmViTriViecLam Methods =============
  async createDmViTriViecLam(dto: CreateDmViTriViecLamDto) {
    return this.prisma.dmViTriViecLam.create({ data: dto });
  }

  async findAllDmViTriViecLam() {
    return this.prisma.dmViTriViecLam.findMany();
  }

  async findOneDmViTriViecLam(id: number) {
    return this.prisma.dmViTriViecLam.findUnique({ where: { id } });
  }

  async updateDmViTriViecLam(id: number, dto: UpdateDmViTriViecLamDto) {
    return this.prisma.dmViTriViecLam.update({ where: { id }, data: dto });
  }

  async removeDmViTriViecLam(id: number) {
    return this.prisma.dmViTriViecLam.delete({ where: { id } });
  }
}
