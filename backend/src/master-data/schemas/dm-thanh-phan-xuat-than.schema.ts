import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseDMSchema } from './common/base-dm.schema';

@Schema({
  timestamps: true,
  collection: 'dm_thanh_phan_xuat_than',
})
export class DmThanhPhanXuatThan extends BaseDMSchema {
  @Prop({ required: true, maxlength: 10 })
  ma: string;

  @Prop({ required: true, maxlength: 100 })
  ten: string;
}

export const DmThanhPhanXuatThanSchema =
  SchemaFactory.createForClass(DmThanhPhanXuatThan);
