import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseDMSchema } from './common/base-dm.schema';

@Schema({
  timestamps: true,
  collection: 'dm_quoc_gia',
})
export class DmQuocGia extends BaseDMSchema {
  @Prop({ required: true, maxlength: 5 })
  ma: string;

  @Prop({ required: true, maxlength: 100 })
  ten: string;

  @Prop({ maxlength: 10 })
  maChauLuc: string;
}

export const DmQuocGiaSchema = SchemaFactory.createForClass(DmQuocGia);
