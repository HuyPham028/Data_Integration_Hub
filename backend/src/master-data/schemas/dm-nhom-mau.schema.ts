import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseDMSchema } from './common/base-dm.schema';

@Schema({
  timestamps: true,
  collection: 'dm_nhom_mau',
})
export class DmNhomMau extends BaseDMSchema {
  @Prop({ required: true, maxlength: 5 })
  ma: string;

  @Prop({ required: true, maxlength: 50 })
  ten: string;
}

export const DmNhomMauSchema = SchemaFactory.createForClass(DmNhomMau);
