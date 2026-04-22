import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { SchemaRegistryService } from 'src/common/schema-registry/schema-registry.service';
import { SyncEngineService } from 'src/modules/sync-engine/sync-engine.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventLogService } from 'src/common/event-log/event-log.service';

interface SourceApiMetadata {
  tableName?: string;
  totalRecords?: number;
  totalPages?: number;
  currentPage?: number;
  limit?: number;
}

interface SourceApiResponse {
  success: true;
  timestamp?: string;
  metadata?: SourceApiMetadata;
  payload: Record<string, unknown>[];
}

type TableSyncSuccessResult = {
  table: string;
  status: 'success';
  totalRecordsSynced: number;
};

type TableSyncFailedResult = {
  table: string;
  status: 'failed';
  error: string;
};

type TableSyncResult = TableSyncSuccessResult | TableSyncFailedResult;

@Injectable()
export class DataIntegrationService {
  private readonly logger = new Logger(DataIntegrationService.name);
  private readonly BATCH_LIMIT = 5000;

  constructor(
    private readonly schemaRegistry: SchemaRegistryService,
    private readonly syncEngine: SyncEngineService,
    private readonly httpService: HttpService,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
    private readonly eventLogService: EventLogService,
  ) {}

  private broadcastLog(
    message: string,
    type: 'INFO' | 'WARN' | 'ERROR' = 'INFO',
  ) {
    if (type == 'ERROR') this.logger.error(message);
    else if (type == 'WARN') this.logger.warn(message);
    else this.logger.log(message);

    this.eventEmitter.emit('sync.log', {
      timestamp: new Date().toISOString(),
      type,
      message,
    });
  }

  private async processSingleTable(schema: any, baseUrl: string, token: string): Promise<TableSyncResult & { skipped?: boolean }> {
  this.broadcastLog(`[START] Processing table: ${schema.tableName}...`);
  let currentPage = 1, totalPages = 1, totalSyncedForTable = 0;
  let shouldSkipSync = false;
  let sourceTimestamp: Date | null = null;

  try {
    if (!schema.dataFromApi) throw new Error(`Skipping ${schema.tableName} - No dataFromApi defined.`);
    if (schema.dataFromApi.includes('check-all-schemas')) throw new Error('No real data endpoint configured');
    
    const primaryKey = schema.primaryKey?.[0];
    if (!primaryKey) throw new Error(`Skipping ${schema.tableName} - No primary key configured.`);

    do {
      const separator = schema.dataFromApi.includes('?') ? '&' : '?';
      const tokenParam = token ? `&accessToken=${token}` : '';
      const paginatedUrl = `${baseUrl}${schema.dataFromApi}${separator}page=${currentPage}&limit=${this.BATCH_LIMIT}${tokenParam}`;

      this.broadcastLog(`Fetching page ${currentPage}/${totalPages} -> ${paginatedUrl}`);
      
      const response = await firstValueFrom(this.httpService.request({
        method: schema.dataFromMethod || 'GET', url: paginatedUrl, timeout: 10000,
      }));
      const responseData = response.data as SourceApiResponse;

      if (!responseData?.success || !Array.isArray(responseData?.payload)) {
        throw new Error('[API CONTRACT VIOLATION] Invalid data format.');
      }

      const rawDataArray = responseData.payload;
      const meta = responseData.metadata || {};

      if (meta.currentPage && meta.currentPage !== currentPage) break;

      if (currentPage === 1) {
        if (meta.totalPages) totalPages = meta.totalPages;
        sourceTimestamp = responseData.timestamp ? new Date(responseData.timestamp) : null;
        const lastSyncTime = schema.lastSyncTime ? new Date(schema.lastSyncTime) : null;

        if (sourceTimestamp && lastSyncTime && sourceTimestamp.getTime() <= lastSyncTime.getTime()) {
          this.broadcastLog(`[INCREMENTAL CHECK] No new data for ${schema.tableName}. Skipping.`, 'INFO');
          shouldSkipSync = true;
          break;
        }
      }

      if (rawDataArray.length === 0) break;

      this.broadcastLog(`Syncing ${rawDataArray.length} records...`);
      await this.syncEngine.syncTableData(schema.tableName, rawDataArray, primaryKey);
      
      totalSyncedForTable += rawDataArray.length;
      currentPage++;
    } while (currentPage <= totalPages);

    if (!shouldSkipSync) await this.updateLastSyncTime(schema.tableName, sourceTimestamp ?? new Date());

    this.broadcastLog(shouldSkipSync ? `[DONE] Skipped ${schema.tableName}` : `[DONE] Successfully synced ${totalSyncedForTable} records for ${schema.tableName}.`);
    
    return { table: schema.tableName, status: 'success', totalRecordsSynced: totalSyncedForTable, skipped: shouldSkipSync };
  } catch (error: any) {
    this.broadcastLog(`[ERROR] Failed to integrate ${schema.tableName}: ${error.message}`, 'WARN');
    return { table: schema.tableName, status: 'failed', error: error.message };
  }
}

  async updateLastSyncTime(tableName: string, timestamp: Date) {
    return this.schemaRegistry.updateLastSyncTime(tableName, timestamp);
  }

  /**
   * Run full sync of all tables with Pagination & Strict API Contract
   */
  async runFullIntegrationPipeline() {
    this.broadcastLog('--- STARTING FULL INTEGRATION PIPELINE ---');
    const runLog = await this.eventLogService.createJobLog(
      'Full Integration Sync',
      'FULL_SYNC',
      'sync',
    );

    // 1. Chỉ lấy các schema đang ở trạng thái an toàn (stable)
    try {
      const allSchemas = await this.schemaRegistry.getAllSchema();
      const schemasToSync = allSchemas.filter((s) => s.status === 'stable');
      const skippedSchemas = allSchemas.filter((s) => s.status !== 'stable');

      if (skippedSchemas.length > 0) {
        this.broadcastLog(
          `Skipping ${skippedSchemas.length} tables due to schema changes/new tables.`,
          'WARN',
        );
      }

      if (!schemasToSync || schemasToSync.length === 0) {
        this.broadcastLog('No stable schemas found. Aborting sync.', 'WARN');
        await this.eventLogService.finishJobLog(
          runLog.id,
          'failed',
          {
            tables: { success: 0, failed: 0, skipped: skippedSchemas.length },
            success: 0,
            failed: 0,
          },
          ['No stable schemas found'],
        );
        return { message: 'No tables ready for sync' };
      }

      const syncResults: TableSyncResult[] = [];

      const baseUrl = this.configService.get<string>('SOURCE_API_BASE_URL', '');
      const token = this.configService.get<string>('SOURCE_API_TOKEN', '');
      // 2. Lặp qua từng bảng để xử lý
      for (const schema of schemasToSync) {
        const result = await this.processSingleTable(schema, baseUrl, token);
        syncResults.push(result);
      }

      const successRecords = syncResults
        .filter(
          (result): result is TableSyncSuccessResult =>
            result.status === 'success',
        )
        .reduce((sum, result) => sum + result.totalRecordsSynced, 0);

      const failedCount = syncResults.filter(
        (result) => result.status === 'failed',
      ).length;
      const successCount = syncResults.filter(
        (result) => result.status === 'success',
      ).length;
      const status =
        failedCount === 0
          ? 'done'
          : successCount > 0
            ? 'partial_success'
            : 'failed';

      await this.eventLogService.finishJobLog(
        runLog.id,
        status,
        {
          tableResults: syncResults,
          tables: {
            success: successCount,
            failed: failedCount,
            skipped: skippedSchemas.length,
          },
          success: successRecords,
          failed: failedCount,
        },
        syncResults
          .filter(
            (result): result is TableSyncFailedResult =>
              result.status === 'failed',
          )
          .map((result) => result.error),
      );

      this.broadcastLog('--- FULL INTEGRATION PIPELINE FINISHED ---');
      return syncResults;
    } catch (error: any) {
      await this.eventLogService.finishJobLog(
        runLog.id,
        'failed',
        {
          tables: { success: 0, failed: 1, skipped: 0 },
          success: 0,
          failed: 1,
        },
        [error.message || 'Unknown integration pipeline error'],
      );
      throw error;
    }
  }

  async runCustomIntegrationPipeline(tableNames: string[]) {
    this.broadcastLog('--- STARTING CUSTOM INTEGRATION PIPELINE ---');
    const runLog = await this.eventLogService.createJobLog(
      'Custom Integration Sync',
      'CUSTOM_SYNC',
      'sync',
    );

    try {
      const normalizedTableNames = Array.from(
        new Set((tableNames || []).map((name) => name?.trim()).filter(Boolean)),
      ) as string[];

      if (normalizedTableNames.length === 0) {
        await this.eventLogService.finishJobLog(
          runLog.id,
          'failed',
          {
            tables: {
              requested: 0,
              matched: 0,
              missing: 0,
              success: 0,
              failed: 0,
              skipped: 0,
            },
            success: 0,
            failed: 0,
          },
          ['No table names provided for custom integration pipeline'],
        );

        this.broadcastLog(
          'No table names provided. Aborting custom sync.',
          'WARN',
        );
        return { message: 'No table names provided' };
      }

      const allSchemas = await this.schemaRegistry.getAllSchema();
      const stableSchemas = allSchemas.filter((s) => s.status === 'stable');
      const stableSchemaMap = new Map(
        stableSchemas.map((s) => [s.tableName, s]),
      );

      const schemasToSync = normalizedTableNames
        .map((tableName) => stableSchemaMap.get(tableName))
        .filter((schema): schema is NonNullable<typeof schema> =>
          Boolean(schema),
        );

      const missingTables = normalizedTableNames.filter(
        (tableName) => !stableSchemaMap.has(tableName),
      );

      if (schemasToSync.length === 0) {
        await this.eventLogService.finishJobLog(
          runLog.id,
          'failed',
          {
            tables: {
              requested: normalizedTableNames.length,
              matched: 0,
              missing: missingTables.length,
              success: 0,
              failed: 0,
              skipped: 0,
            },
            success: 0,
            failed: 0,
          },
          missingTables.length > 0
            ? [
                `No matching stable schemas found for: ${missingTables.join(', ')}`,
              ]
            : ['No matching stable schemas found'],
        );

        this.broadcastLog(
          'No matching stable schemas found for custom sync.',
          'WARN',
        );
        return {
          message: 'No matching stable schemas found',
          requestedTables: normalizedTableNames,
          missingTables,
          results: [],
        };
      }

      if (missingTables.length > 0) {
        this.broadcastLog(
          `Skipping ${missingTables.length} requested table(s) because schema is missing or not stable: ${missingTables.join(', ')}`,
          'WARN',
        );
      }

      const syncResults: TableSyncResult[] = [];

      const baseUrl = this.configService.get<string>('SOURCE_API_BASE_URL', '');
      const token = this.configService.get<string>('SOURCE_API_TOKEN', '');
      for (const schema of schemasToSync) {
        const result = await this.processSingleTable(schema, baseUrl, token);
        syncResults.push(result);
      }

      const successRecords = syncResults
        .filter(
          (result): result is TableSyncSuccessResult =>
            result.status === 'success',
        )
        .reduce((sum, result) => sum + result.totalRecordsSynced, 0);

      const failedCount = syncResults.filter(
        (result) => result.status === 'failed',
      ).length;
      const successCount = syncResults.filter(
        (result) => result.status === 'success',
      ).length;
      const status =
        failedCount === 0
          ? 'done'
          : successCount > 0
            ? 'partial_success'
            : 'failed';

      await this.eventLogService.finishJobLog(
        runLog.id,
        status,
        {
          tableResults: syncResults,
          tables: {
            requested: normalizedTableNames.length,
            matched: schemasToSync.length,
            missing: missingTables.length,
            success: successCount,
            failed: failedCount,
            skipped: 0,
          },
          success: successRecords,
          failed: failedCount,
        },
        [
          ...syncResults
            .filter(
              (result): result is TableSyncFailedResult =>
                result.status === 'failed',
            )
            .map((result) => `[${result.table}] ${result.error}`),
          ...(missingTables.length > 0
            ? [`Missing or unstable tables: ${missingTables.join(', ')}`]
            : []),
        ],
      );

      this.broadcastLog('--- CUSTOM INTEGRATION PIPELINE FINISHED ---');
      return {
        requestedTables: normalizedTableNames,
        syncedTables: schemasToSync.map((schema) => schema.tableName),
        missingTables,
        results: syncResults,
      };
    } catch (error: any) {
      await this.eventLogService.finishJobLog(
        runLog.id,
        'failed',
        {
          tables: {
            requested: tableNames?.length || 0,
            matched: 0,
            missing: 0,
            success: 0,
            failed: 1,
            skipped: 0,
          },
          success: 0,
          failed: 1,
        },
        [error.message || 'Unknown custom integration pipeline error'],
      );
      throw error;
    }
  }
}
