import { Prop, Schema } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Base schema cho các bảng dữ liệu tham chiếu có cấu trúc: ma - ten - active
 */
export abstract class BaseDMSchema extends Document {
  @Prop({ required: true })
  ma: string;

  @Prop({ required: true })
  ten: string;

  @Prop({ default: true })
  active: boolean;
}
