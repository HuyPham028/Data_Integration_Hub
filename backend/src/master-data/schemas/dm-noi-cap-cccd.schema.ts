import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseDMSchema } from './common/base-dm.schema';

@Schema({
  timestamps: true,
  collection: 'dm_noi_cap_cccd',
})
export class DmNoiCapCCCD extends BaseDMSchema {
  @Prop({ required: true, maxlength: 10 })
  ma: string;

  @Prop({ required: true, maxlength: 100 })
  ten: string;
}

export const DmNoiCapCCCDSchema = SchemaFactory.createForClass(DmNoiCapCCCD);
