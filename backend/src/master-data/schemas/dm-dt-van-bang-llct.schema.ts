import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseDMSchema } from './common/base-dm.schema';

@Schema({
  timestamps: true,
  collection: 'dm_dt_van_bang_llct',
})
export class DmDtVanBangLLCT extends BaseDMSchema {
  @Prop({ required: true, maxlength: 5 })
  ma: string;

  @Prop({ required: true, maxlength: 100 })
  ten: string;
}

export const DmDtVanBangLLCTSchema =
  SchemaFactory.createForClass(DmDtVanBangLLCT);
