import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseDMSchema } from './common/base-dm.schema';

@Schema({
  timestamps: true,
  collection: 'dm_quan_he_gia_dinh',
})
export class DmQuanHeGiaDinh extends BaseDMSchema {
  @Prop({ required: true, maxlength: 5 })
  ma: string;

  @Prop({ required: true, maxlength: 50 })
  ten: string;
}

export const DmQuanHeGiaDinhSchema =
  SchemaFactory.createForClass(DmQuanHeGiaDinh);
