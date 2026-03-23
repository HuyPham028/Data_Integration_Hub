import { Injectable, Logger } from '@nestjs/common';
import { EventLogService } from 'src/common/event-log/event-log.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SyncEngineService {
  private readonly logger = new Logger(SyncEngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventLogService: EventLogService,
  ) {}

  private getPrismaModelName(tableName: string): string {
    return tableName.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
  }

  /**
   * @param tableName
   * @param dataArray
   * @param primaryKeyColumn
   */
  async syncTableData(tableName: string, dataArray: any[], primaryKeyColumn: string) {
    const modelName = this.getPrismaModelName(tableName);
    
    // Check if this model has been defined in prisma 
    if (!this.prisma[modelName]) {
      this.logger.error(`Model ${modelName} (for table ${tableName}) does not exist in Prisma.`);
      return;
    }

    const log = await this.eventLogService.createJobLog(
      `Sync Data: ${tableName}`,
      'data_sync',
      'etl_pipeline'
    );

    let successCount = 0;
    let failedCount = 0;
    const errors: Array<{ pk: any; error: string }> = [];

    for (const record of dataArray) {
      try {
        const pkValue = record[primaryKeyColumn];
        
        if (!pkValue) {
          throw new Error(`Missing primary key (${primaryKeyColumn}) in record`);
        }

        await this.prisma[modelName].upsert({
          where: { [primaryKeyColumn]: pkValue },
          update: record,
          create: record,
        });

        successCount++;
      } catch (error) {
        failedCount++;
        errors.push({ pk: record[primaryKeyColumn], error: error.message });
        // not breaking the loop, if one record has error, then continue to other
      }
    }

    const finalStatus = failedCount === 0 ? 'done' : successCount > 0 ? 'partial_success' : 'failed';
    
    await this.eventLogService.finishJobLog(log._id as unknown as string, finalStatus, {
      totalToSync: dataArray.length,
      success: successCount,
      failed: failedCount,
    }, errors);

    this.logger.log(`Sync table ${tableName} finished. Success: ${successCount}, Failed: ${failedCount}`);
  }
}