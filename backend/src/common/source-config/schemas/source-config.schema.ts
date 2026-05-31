import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'source_configs' })
export class SourceConfig extends Document {
  @Prop({ required: true, unique: true })
  sourceId!: string;

  @Prop({ required: true })
  baseUrl!: string;

  @Prop({ default: '' })
  token!: string;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ default: '' })
  displayName!: string;

  @Prop({ default: '' })
  description!: string;

  @Prop({ default: 'none' })
  authType!: string;
}

export const SourceConfigSchema = SchemaFactory.createForClass(SourceConfig);
