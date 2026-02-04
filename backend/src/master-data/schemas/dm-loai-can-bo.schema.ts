import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseDMSchema } from './common/base-dm.schema';

@Schema({
  timestamps: true,
  collection: 'dm_loai_can_bo',
})
export class DmLoaiCanBo extends BaseDMSchema {
  @Prop({ required: true, maxlength: 5 })
  ma: string;

  @Prop({ required: true, maxlength: 50 })
  ten: string;
}

export const DmLoaiCanBoSchema = SchemaFactory.createForClass(DmLoaiCanBo);
