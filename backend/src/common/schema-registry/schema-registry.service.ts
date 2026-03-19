import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SchemaRegistry } from './schemas/schema-registry.schema';
import { EventLogService } from '../event-log/event-log.service';

@Injectable()
export class SchemaRegistryService {
  private readonly logger = new Logger(SchemaRegistryService.name);

  constructor(
    @InjectModel(SchemaRegistry.name) private registryModel: Model<SchemaRegistry>,
    private readonly eventLogService: EventLogService,
  ) {}

  async importSchemaData(rawDataArray: any[]) {
    // 1. Initialize Log Job
    const log = await this.eventLogService.createJobLog(
      'Import Teacher Schema Data',
      'schema_init',
      'system_setup',
    );

    let successCount = 0;
    let failedCount = 0;
    const errors: { table: any; error: any }[] = [];

    for (const rawData of rawDataArray) {
      try {
        const sanitizedData = {
          ...rawData,
          createdAt: rawData.createdAt?.$date ? new Date(rawData.createdAt.$date) : undefined,
          updatedAt: rawData.updatedAt?.$date ? new Date(rawData.updatedAt.$date) : undefined,
        };
        delete sanitizedData._id; 
        delete sanitizedData.__v;

        await this.registryModel.findOneAndUpdate(
          { tableName: sanitizedData.tableName },
          { $set: sanitizedData },
          { upsert: true, new: true }
        );
        successCount++;
      } catch (error) {
        this.logger.error(`Failed to import table ${rawData.tableName}: ${error.message}`);
        failedCount++;
        errors.push({ table: rawData.tableName, error: error.message });
      }
    }

    const finalStatus = failedCount === 0 ? 'done' : successCount > 0 ? 'partial_success' : 'failed';
    
    await this.eventLogService.finishJobLog(log._id.toString(), finalStatus, {
      total: rawDataArray.length,
      success: successCount,
      failed: failedCount,
    }, errors);

    return {
      message: 'Import process finished',
      status: finalStatus,
      successCount,
      failedCount,
    };
  }
 
  async getAllSchema() {
    return this.registryModel.find().exec();
  }
  
  async getSchemaByTableName(tableName: string) {
    return this.registryModel.findOne({ tableName }).exec();
  }
}