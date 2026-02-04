import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseDMSchema } from './common/base-dm.schema';

@Schema({
  timestamps: true,
  collection: 'dm_trinh_do_chuyen_mon',
})
export class DmTrinhDoChuyenMon extends BaseDMSchema {
  @Prop({ required: true, maxlength: 5 })
  ma: string;

  @Prop({ required: true, maxlength: 50 })
  ten: string;
}

export const DmTrinhDoChuyenMonSchema =
  SchemaFactory.createForClass(DmTrinhDoChuyenMon);
