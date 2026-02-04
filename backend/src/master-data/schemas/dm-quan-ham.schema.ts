import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseDMSchema } from './common/base-dm.schema';

@Schema({
  timestamps: true,
  collection: 'dm_quan_ham',
})
export class DmQuanHam extends BaseDMSchema {
  @Prop({ required: true, maxlength: 10 })
  ma: string;

  @Prop({ required: true, maxlength: 50 })
  ten: string;
}

export const DmQuanHamSchema = SchemaFactory.createForClass(DmQuanHam);
