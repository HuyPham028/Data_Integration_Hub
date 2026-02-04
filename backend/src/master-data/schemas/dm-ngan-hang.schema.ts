import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseDMSchema } from './common/base-dm.schema';

@Schema({
  timestamps: true,
  collection: 'dm_ngan_hang',
})
export class DmNganHang extends BaseDMSchema {
  @Prop({ required: true, maxlength: 20 })
  ma: string;

  @Prop({ required: true, maxlength: 200 })
  ten: string;
}

export const DmNganHangSchema = SchemaFactory.createForClass(DmNganHang);
