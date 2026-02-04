import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseDMSchema } from './common/base-dm.schema';

@Schema({
  timestamps: true,
  collection: 'dm_vi_tri_viec_lam',
})
export class DmViTriViecLam extends BaseDMSchema {
  @Prop({ required: true, maxlength: 20 })
  ma: string;

  @Prop({ required: true, maxlength: 100 })
  ten: string;

  @Prop({ maxlength: 20 })
  loaiVtvl: string;
}

export const DmViTriViecLamSchema =
  SchemaFactory.createForClass(DmViTriViecLam);
