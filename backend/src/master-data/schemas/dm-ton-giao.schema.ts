import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseDMSchema } from './common/base-dm.schema';

@Schema({
  timestamps: true,
  collection: 'dm_ton_giao',
})
export class DmTonGiao extends BaseDMSchema {
  @Prop({ required: true, maxlength: 5 })
  ma: string;

  @Prop({ required: true, maxlength: 100 })
  ten: string;
}

export const DmTonGiaoSchema = SchemaFactory.createForClass(DmTonGiao);
