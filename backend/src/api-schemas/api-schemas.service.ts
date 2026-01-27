import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiSchema } from './schemas/api-schema.schema';

@Injectable()
export class ApiSchemasService {
  constructor(
    @InjectModel(ApiSchema.name) private apiSchemaModel: Model<ApiSchema>,
  ) {}

  async findAll(): Promise<ApiSchema[]> {
    console.log('Database Name:', this.apiSchemaModel.db.name); 
    console.log('Collection Name:', this.apiSchemaModel.collection.name);
    
    const count = await this.apiSchemaModel.countDocuments();
    console.log('Total documents:', count);

    return this.apiSchemaModel.find().exec();
  }

  async findOne(tableName: string): Promise<ApiSchema> {
    const res = await this.apiSchemaModel.findOne({ tableName }).exec();
    if(!res) throw new NotFoundException('Item not found');
    return res;
  }
}