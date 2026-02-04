import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseDMSchema } from './common/base-dm.schema';

@Schema({
  timestamps: true,
  collection: 'dm_trinh_do_pho_thong',
})
export class DmTrinhDoPhoThong extends BaseDMSchema {
  @Prop({ required: true, maxlength: 5 })
  ma: string;

  @Prop({ required: true, maxlength: 50 })
  ten: string;
}

export const DmTrinhDoPhoThongSchema =
  SchemaFactory.createForClass(DmTrinhDoPhoThong);
