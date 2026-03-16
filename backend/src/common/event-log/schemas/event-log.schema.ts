import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class EventLog extends Document {
  @Prop({ required: true })
  title: string;

  @Prop()
  tag: string;

  @Prop({ required: true, enum: ['running', 'done', 'failed', 'partial_success'] })
  status: string;

  @Prop()
  type: string;

  @Prop({ type: Object })
  details: Record<string, any>;
}

export const EventLogSchema = SchemaFactory.createForClass(EventLog);