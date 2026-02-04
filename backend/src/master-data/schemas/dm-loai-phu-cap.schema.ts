import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseDMSchema } from './common/base-dm.schema';

@Schema({
  timestamps: true,
  collection: 'dm_loai_phu_cap',
})
export class DmLoaiPhuCap extends BaseDMSchema {
  @Prop({ required: true, maxlength: 10 })
  ma: string;

  @Prop({ required: true, maxlength: 100 })
  ten: string;
}

export const DmLoaiPhuCapSchema = SchemaFactory.createForClass(DmLoaiPhuCap);
