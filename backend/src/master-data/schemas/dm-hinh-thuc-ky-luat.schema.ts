import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseDMSchema } from './common/base-dm.schema';

@Schema({
  timestamps: true,
  collection: 'dm_hinh_thuc_ky_luat',
})
export class DmHinhThucKyLuat extends BaseDMSchema {
  @Prop({ required: true, maxlength: 50 })
  ma: string;

  @Prop({ required: true, maxlength: 500 })
  ten: string;
}

export const DmHinhThucKyLuatSchema =
  SchemaFactory.createForClass(DmHinhThucKyLuat);
