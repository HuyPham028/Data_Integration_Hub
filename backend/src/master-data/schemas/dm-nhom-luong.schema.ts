import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  timestamps: true,
  collection: 'dm_nhom_luong',
})
export class DmNhomLuong extends Document {
  @Prop({ required: true, maxlength: 10 })
  nhomLuong: string;

  @Prop({ required: true, type: Number })
  maBacLuong: number;

  @Prop({ required: true, maxlength: 10 })
  tenBacLuong: string;

  @Prop({ required: true, type: Number })
  heSoLuong: number;
}

export const DmNhomLuongSchema = SchemaFactory.createForClass(DmNhomLuong);
