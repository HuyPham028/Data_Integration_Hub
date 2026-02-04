import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  timestamps: true,
  collection: 'tcns_ly_lich',
})
export class TcnsLyLich extends Document {
  @Prop({ required: true, maxlength: 255 })
  shcc: string;

  @Prop({ required: true, maxlength: 20 })
  maNhanVien: string;

  @Prop({ required: true, maxlength: 150 })
  ho: string;

  @Prop({ required: true, maxlength: 50 })
  ten: string;

  @Prop({ type: Date })
  ngaySinh: Date;

  @Prop({ maxlength: 5 })
  thanhPhanGiaDinh: string;

  @Prop({ maxlength: 5 })
  thanhPhanBanThan: string;

  @Prop({ maxlength: 5 })
  gioiTinh: string;

  @Prop({ maxlength: 5 })
  danToc: string;

  @Prop({ maxlength: 5 })
  tonGiao: string;

  @Prop({ maxlength: 5 })
  quocTich: string;

  @Prop({ maxlength: 70 })
  emailCaNhan: string;

  @Prop({ type: Number })
  chieuCao: number;

  @Prop({ type: Number })
  canNang: number;

  @Prop({ maxlength: 5 })
  nhomMau: string;

  @Prop({ type: Date })
  ngayNhapNgu: Date;

  @Prop({ type: Date })
  ngayXuatNgu: Date;

  @Prop({ maxlength: 5 })
  quanHam: string;

  @Prop({ type: Date })
  ngayVaoDang: Date;

  @Prop({ type: Date })
  ngayVaoDangCt: Date;

  @Prop({ type: Date })
  ngayVaoDoan: Date;

  @Prop({ maxlength: 20 })
  maSoThue: string;

  @Prop({ maxlength: 20 })
  stk: string;

  @Prop({ maxlength: 100 })
  nganHang: string;

  @Prop({ maxlength: 70 })
  email: string;

  @Prop({ maxlength: 200 })
  chiNhanh: string;

  @Prop({ maxlength: 100 })
  biDanh: string;

  @Prop({ maxlength: 20 })
  cccd: string;

  @Prop({ maxlength: 500 })
  sucKhoe: string;

  @Prop({ type: Boolean })
  isDangVien: boolean;

  @Prop({ type: Date })
  ngayVaoCongDoan: Date;

  @Prop({ maxlength: 20 })
  bhxh: string;

  @Prop({ maxlength: 100 })
  doiTuongChinhSach: string;

  @Prop({ maxlength: 20 })
  bhyt: string;

  @Prop({ type: Date })
  ngayCapCccd: Date;

  @Prop({ maxlength: 5 })
  noiCapCccd: string;

  @Prop({ maxlength: 20 })
  sdt: string;
}

export const TcnsLyLichSchema = SchemaFactory.createForClass(TcnsLyLich);
