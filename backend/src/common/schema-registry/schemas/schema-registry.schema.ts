import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class SchemaRegistry extends Document {
  @Prop({ required: true, unique: true })
  tableName!: string;

  @Prop({ type: [String] })
  primaryKey!: string[];

  @Prop({ type: Date })
  lastSyncTime?: Date;

  @Prop()
  fieldsCount!: number;

  @Prop()
  recordsCount!: number;

  @Prop()
  description!: string;

  @Prop()
  dataFrom!: string;

  @Prop()
  dataFromApi!: string;

  @Prop()
  dataFromMethod!: string;

  @Prop({ type: [{ type: Object }] })
  details!: Record<string, any>[];

  @Prop({ type: [{ type: Object }] })
  oldDetails!: Record<string, any>[];

  @Prop()
  hashValue!: string;

  @Prop({ default: 'stable', enum: ['stable', 'changed', 'new'] })
  status!: string;
}

export const SchemaRegistrySchema = SchemaFactory.createForClass(SchemaRegistry);