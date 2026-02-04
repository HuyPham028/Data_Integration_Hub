import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseDMSchema } from './common/base-dm.schema';

@Schema({
  timestamps: true,
  collection: 'dm_loai_chuc_vu',
})
export class DmLoaiChucVu extends BaseDMSchema {
  @Prop({ required: true, maxlength: 5 })
  ma: string;

  @Prop({ required: true, maxlength: 70 })
  ten: string;
}

export const DmLoaiChucVuSchema = SchemaFactory.createForClass(DmLoaiChucVu);
