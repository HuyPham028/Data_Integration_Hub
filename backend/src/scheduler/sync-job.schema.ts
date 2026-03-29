import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class SyncJob extends Document {
  @Prop({ required: true, unique: true })
  jobName: string;

  @Prop({ required: true })
  jobType: string;

  @Prop({ required: true })
  cronExpression: string; // Biểu thức Cron: "0 2 * * *" (2h sáng mỗi ngày)

  @Prop({ default: false })
  isActive: boolean;

  @Prop()
  lastRunAt: Date;

  @Prop()
  description: string;
}

export const SyncJobSchema = SchemaFactory.createForClass(SyncJob);