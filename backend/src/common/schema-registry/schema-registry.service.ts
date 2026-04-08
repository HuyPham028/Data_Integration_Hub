import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SchemaRegistry } from './schemas/schema-registry.schema';
import { EventLogService } from '../event-log/event-log.service';
import { UpdateSchemaRegistryDto } from './dto/update-schema-registry.dto';

@Injectable()
export class SchemaRegistryService {
  private readonly logger = new Logger(SchemaRegistryService.name);

  constructor(
    @InjectModel(SchemaRegistry.name)
    private registryModel: Model<SchemaRegistry>,
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
          createdAt: rawData.createdAt?.$date
            ? new Date(rawData.createdAt.$date)
            : undefined,
          updatedAt: rawData.updatedAt?.$date
            ? new Date(rawData.updatedAt.$date)
            : undefined,
        };
        delete sanitizedData._id;
        delete sanitizedData.__v;

        await this.registryModel.findOneAndUpdate(
          { tableName: sanitizedData.tableName },
          { $set: sanitizedData },
          { upsert: true, new: true },
        );
        successCount++;
      } catch (error) {
        this.logger.error(
          `Failed to import table ${rawData.tableName}: ${error.message}`,
        );
        failedCount++;
        errors.push({ table: rawData.tableName, error: error.message });
      }
    }

    const finalStatus =
      failedCount === 0
        ? 'done'
        : successCount > 0
          ? 'partial_success'
          : 'failed';

    await this.eventLogService.finishJobLog(
      log._id.toString(),
      finalStatus,
      {
        total: rawDataArray.length,
        success: successCount,
        failed: failedCount,
      },
      errors,
    );

    return {
      message: 'Import process finished',
      status: finalStatus,
      successCount,
      failedCount,
    };
  }

  async getAllSchema() {
    return this.registryModel.find({}).exec();
  }

  async detectSchemaChanges(fetchedSchemas: any[]) {
    let changesDetected = 0;
    let newSchemas = 0;

    for (const incoming of fetchedSchemas) {
      const existing = await this.registryModel.findOne({
        tableName: incoming.tableName,
      });

      if (!existing) {
        const sanitized = { ...incoming, status: 'new' };
        delete sanitized._id;
        delete sanitized.__v;

        await this.registryModel.create(sanitized);
        newSchemas++;
        this.logger.warn(
          `[NEW SCHEMA DETECTED] Bảng mới: ${incoming.tableName}`,
        );
      } else if (
        existing.hashValue !== incoming.hashValue ||
        existing.details !== incoming.details
      ) {
        // TRƯỜNG HỢP 2: Bảng đã có, nhưng cấu trúc thay đổi (Hash khác nhau)
        // Lưu details hiện tại vào oldDetails để làm lịch sử
        const oldDetailsArray = existing.oldDetails || [];
        oldDetailsArray.push(existing.details);

        await this.registryModel.findOneAndUpdate(
          { tableName: incoming.tableName },
          {
            $set: {
              details: incoming.details,
              hashValue: incoming.hashValue,
              fieldsCount: incoming.fieldsCount,
              status: 'changed', // Cảnh báo cho Admin
              oldDetails: oldDetailsArray,
            },
          },
        );
        changesDetected++;
        this.logger.warn(
          `[SCHEMA CHANGED] Bảng thay đổi: ${incoming.tableName}`,
        );
      } else {
        // TRƯỜNG HỢP 3: Không có gì thay đổi (Hash giống nhau)
        // Không làm gì cả, hoặc update updatedAt
        this.logger.log(
          `[SCHEMA STABLE] Bảng ${incoming.tableName} không đổi.`,
        );
      }
    }

    return { message: 'Detection finished', newSchemas, changesDetected };
  }

  // Get All
  async getAllSchemasForAdmin() {
    return this.registryModel.find({}).sort({ updatedAt: -1 }).exec();
  }

  async updateSchema(
    tableName: string,
    updatePayload: UpdateSchemaRegistryDto,
  ) {
    const allowedFields: (keyof UpdateSchemaRegistryDto)[] = [
      'primaryKey',
      'fieldsCount',
      'recordsCount',
      'description',
      'dataFrom',
      'dataFromApi',
      'dataFromMethod',
      'details',
      'hashValue',
      'status',
    ];

    const updateData = Object.fromEntries(
      Object.entries(updatePayload).filter(
        ([key, value]) =>
          allowedFields.includes(key as keyof UpdateSchemaRegistryDto) &&
          value !== undefined,
      ),
    );

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('No valid fields provided to update.');
    }

    if (updateData.details) {
      const existing = await this.registryModel.findOne({ tableName }).lean();
      if (!existing) {
        throw new NotFoundException(`Schema table ${tableName} not found.`);
      }

      // Preserve previous details as a change history snapshot.
      updateData.oldDetails = [
        ...(existing.oldDetails || []),
        ...(existing.details ? [existing.details] : []),
      ];
    }

    const updated = await this.registryModel.findOneAndUpdate(
      { tableName },
      { $set: updateData },
      { new: true },
    );

    if (!updated) {
      throw new NotFoundException(`Schema table ${tableName} not found.`);
    }

    return updated;
  }

  /**
   * Hàm Admin xác nhận "Đã cập nhật file Prisma, cho phép sync tiếp"
   */
  async resolveSchemaWarning(tableName: string) {
    return this.registryModel.findOneAndUpdate(
      { tableName },
      { $set: { status: 'stable' } },
      { new: true },
    );
  }
}
