import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseDMSchema } from './common/base-dm.schema';

@Schema({
  timestamps: true,
  collection: 'dm_xep_loai_chuyen_mon',
})
export class DmXepLoaiChuyenMon extends BaseDMSchema {
  @Prop({ required: true, maxlength: 50 })
  ma: string;

  @Prop({ required: true, maxlength: 500 })
  ten: string;
}

export const DmXepLoaiChuyenMonSchema =
  SchemaFactory.createForClass(DmXepLoaiChuyenMon);
