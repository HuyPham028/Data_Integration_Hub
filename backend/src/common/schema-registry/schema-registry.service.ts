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
import { EventEmitter2 } from '@nestjs/event-emitter';
import { generateSchemaHash } from 'src/utils/schema.util';
import { GitHubDeployService } from '../github-deploy/github-deploy.service';
import { SchemaMigratorService } from './schema-migrator.service';

@Injectable()
export class SchemaRegistryService {
  private readonly logger = new Logger(SchemaRegistryService.name);

  constructor(
    @InjectModel(SchemaRegistry.name)
    private registryModel: Model<SchemaRegistry>,
    private readonly eventLogService: EventLogService,
    private readonly eventEmitter: EventEmitter2,
    private readonly githubDeploy: GitHubDeployService,
    private readonly schemaMigrator: SchemaMigratorService,
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
        const hashValue = generateSchemaHash(rawData.details);

        const sanitizedData = {
          ...rawData,
          hashValue,
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
      } catch (error: any) {
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

  async getSchemaByName(tableName: string) {
    return this.registryModel.findOne({ tableName }).lean().exec();
  }

  async markAsStable(tableName: string) {
    return this.registryModel.findOneAndUpdate(
      { tableName },
      { $set: { status: 'stable' } },
      { new: true },
    );
  }

  async detectSchemaChanges(fetchedSchemas: any[]) {
    let changesDetected = 0;
    let newSchemas = 0;

    for (const incoming of fetchedSchemas) {
      const existing = await this.registryModel.findOne({
        tableName: incoming.tableName,
      });

      const incomingHash = generateSchemaHash(incoming.details);

      if (!existing) {
        const sanitized = { ...incoming, status: 'new' };
        delete sanitized._id;
        delete sanitized.__v;

        await this.registryModel.create(sanitized);
        newSchemas++;
        this.logger.warn(
          `[NEW SCHEMA DETECTED] Bảng mới: ${incoming.tableName}`,
        );
      } else if (existing.hashValue !== incoming.hashValue) {
        // TRƯỜNG HỢP 2: Bảng đã có, nhưng cấu trúc thay đổi (Hash khác nhau)
        // Lưu details hiện tại vào oldDetails để làm lịch sử
        const currentDetails = existing.details || [];

        await this.registryModel.findOneAndUpdate(
          { tableName: incoming.tableName },
          {
            $set: {
              details: incoming.details,
              hashValue: incomingHash, 
              fieldsCount: incoming.fieldsCount,
              status: 'changed', // Cảnh báo cho Admin
              oldDetails: currentDetails,
              // primaryKey: incoming.primaryKey || existing.primaryKey
            },
          },
        );
        changesDetected++;
        this.logger.warn(
          `[SCHEMA CHANGED] Bảng thay đổi: ${incoming.tableName}`,
        );
        this.eventEmitter.emit('schema.changed', { tableName: incoming.tableName });
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
      'lastSyncTime',
      'fieldsCount',
      'recordsCount',
      'description',
      'dataFrom',
      'dataFromApi',
      'dataFromMethod',
      'details',
      'hashValue',
      'status',
      'syncStrategy',
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
   * Bulk approve tất cả bảng đang ở trạng thái "changed" → stable,
   * sau đó trigger 1 commit duy nhất để regenerate toàn bộ schema.prisma.
   */
  // async resolveAllWarnings() {
  //   const result = await this.registryModel.updateMany(
  //     { status: 'changed' },
  //     { $set: { status: 'stable' } },
  //   );

  //   const approvedCount = result.modifiedCount;
  //   this.logger.log(
  //     `[BulkResolve] Approved ${approvedCount} changed schemas → triggering deploy...`,
  //   );

  //   // Trigger 1 commit duy nhất thay vì N commits
  //   this.githubDeploy.triggerSchemaUpdate(`bulk-resolve (${approvedCount} tables)`).catch((err) =>
  //     this.logger.error(`[BulkResolve] Deploy failed: ${err.message}`),
  //   );

  //   return { approvedCount };
  // }

  /**
   * Admin xác nhận thay đổi schema → cập nhật MongoDB status → tự động
   * commit schema.prisma mới lên GitHub để kích hoạt CI/CD pipeline.
   */
  async resolveSchemaWarning(tableName: string) {
    const updated = await this.registryModel.findOneAndUpdate(
      { tableName },
      { $set: { status: 'stable' } },
      { new: true },
    );

    // Migration is now triggered from the controller with explicit SQL from the frontend

    return updated;
  }

  async updateSyncStrategy(
    tableName: string,
    strategy: 'upsert' | 'overwrite' | 'incremental',
  ) {
    const valid = ['upsert', 'overwrite', 'incremental'];
    if (!valid.includes(strategy)) {
      throw new BadRequestException(`Invalid strategy. Must be one of: ${valid.join(', ')}`);
    }
    const updated = await this.registryModel.findOneAndUpdate(
      { tableName },
      { $set: { syncStrategy: strategy } },
      { new: true },
    );
    if (!updated) {
      throw new NotFoundException(`Schema table "${tableName}" not found.`);
    }
    return { tableName, syncStrategy: updated.syncStrategy };
  }

  async updateLastSyncTime(tableName: string, timestamp: Date) {
    return this.registryModel.findOneAndUpdate(
      { tableName },
      { $set: { lastSyncTime: timestamp } },
      { new: true },
    );
  }

  async rejectSchemaWarning(tableName: string) {
    const existing = await this.registryModel.findOne({ tableName });
    if (!existing || existing.status !== 'changed') {
      throw new BadRequestException('Không thể reject bảng này.');
    }

    const previousDetails = existing.oldDetails || [];
    if (previousDetails.length === 0) {
      throw new BadRequestException('Không có cấu trúc cũ để khôi phục.');
    }

    const badHash = existing.hashValue;
    
    const previousHash = generateSchemaHash(previousDetails);

    return this.registryModel.findOneAndUpdate(
      { tableName },
      { 
        $set: { 
          status: 'stable',
          details: previousDetails, // Phục hồi details từ oldDetails
          hashValue: previousHash,  // Phục hồi hash
          fieldsCount: previousDetails.length,
          oldDetails: []
        },
        $addToSet: { ignoredHashes: badHash } 
      },
      { new: true },
    );
  }

  async migrateAllToStandardHash() {
    this.logger.log('--- BẮT ĐẦU MIGRATION CHUẨN HÓA HASH CHO SCHEMA REGISTRY ---');
    
    const allSchemas = await this.registryModel.find({}).exec();
    let updatedCount = 0;
    let failedCount = 0;

    for (const schema of allSchemas) {
      try {
        const newStandardHash = generateSchemaHash(schema.details || []);

        await this.registryModel.updateOne(
          { _id: schema._id },
          { $set: { hashValue: newStandardHash } }
        );

        updatedCount++;
        this.logger.log(`[MIGRATED] Bảng ${schema.tableName}: ${schema.hashValue} -> ${newStandardHash}`);
      } catch (error: any) {
        this.logger.error(`[LỖI MIGRATION] Bảng ${schema.tableName}: ${error.message}`);
        failedCount++;
      }
    }

    this.logger.log(`--- HOÀN TẤT MIGRATION: ${updatedCount} thành công, ${failedCount} thất bại ---`);
    return {
      message: 'Migration hoàn tất',
      total: allSchemas.length,
      updated: updatedCount,
      failed: failedCount
    };
  }
}
