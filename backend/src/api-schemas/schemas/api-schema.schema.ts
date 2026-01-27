import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ApiSchemaDocument = HydratedDocument<ApiSchema>;

// Sub-schema for object array 
@Schema({ _id: false }) // no id needed for object 
export class FieldDetail {
  @Prop({ required: true })
  name: string;

  @Prop()
  type: string;

  @Prop()
  length?: number;

  @Prop()
  description?: string;
}

// Mapping this schema to 'apischemas' 
@Schema({ collection: 'apischemas', timestamps: true }) 
export class ApiSchema {
  @Prop({ required: true, unique: true })
  tableName: string;

  @Prop()
  description: string;

  @Prop()
  dataFromApi: string;

  @Prop({ default: 'GET' })
  dataFromMethod: string;

  @Prop()
  primaryKey: string;

  // Array to contain "details" attributes 
  @Prop({ type: [SchemaFactory.createForClass(FieldDetail)] })
  details: FieldDetail[];

  @Prop()
  hashValue?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const ApiSchemaSchema = SchemaFactory.createForClass(ApiSchema);