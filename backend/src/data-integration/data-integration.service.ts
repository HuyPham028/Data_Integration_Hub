import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { SchemaRegistryService } from 'src/common/schema-registry/schema-registry.service';
import { SyncEngineService } from 'src/modules/sync-engine/sync-engine.service';
import { BackupService } from 'src/modules/backup/backup.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventLogService } from 'src/common/event-log/event-log.service';
import { MemoryProfiler } from 'src/utils/memory-profiler';

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
  skipped?: number;
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
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 10000;

  constructor(
    private readonly schemaRegistry: SchemaRegistryService,
    private readonly syncEngine: SyncEngineService,
    private readonly httpService: HttpService,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
    private readonly eventLogService: EventLogService,
    private readonly backupService: BackupService,
  ) {}

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------

  private broadcastLog(
    message: string,
    type: 'INFO' | 'WARN' | 'ERROR' = 'INFO',
  ) {
    if (type === 'ERROR') this.logger.error(message);
    else if (type === 'WARN') this.logger.warn(message);
    else this.logger.log(message);

    this.eventEmitter.emit('sync.log', {
      timestamp: new Date().toISOString(),
      type,
      message,
    });
  }

  /**
   * Retry wrapper — chỉ retry lỗi mạng/timeout.
   * KHÔNG retry lỗi nghiệp vụ (contract violation, page mismatch).
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    context: string,
  ): Promise<T> {
    let lastError: Error = new Error('Unknown error');
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (attempt < this.MAX_RETRIES) {
          this.broadcastLog(
            `[RETRY ${attempt}/${this.MAX_RETRIES}] ${context} — thử lại sau ${this.RETRY_DELAY_MS / 1000}s... (lỗi: ${error.message})`,
            'WARN',
          );
          await new Promise((resolve) =>
            setTimeout(resolve, this.RETRY_DELAY_MS),
          );
        }
      }
    }
    throw new Error(
      `[MAX RETRIES EXCEEDED] ${context} — thất bại sau ${this.MAX_RETRIES} lần thử. Lỗi cuối: ${lastError.message}`,
    );
  }

  /**
   * Lọc records theo record.updatedAt > lastSyncTime (BE-side filter).
   * Dùng cho chiến lược incremental khi source API không hỗ trợ filter updatedAfter.
   *
   * - Nếu lastSyncTime = null (lần đầu sync) → trả về toàn bộ (full load).
   * - Nếu record không có updatedAt → luôn sync (an toàn hơn là bỏ qua).
   */
  private filterByUpdatedAt(
    records: Record<string, unknown>[],
    lastSyncTime: Date | null,
  ): Record<string, unknown>[] {
    if (!lastSyncTime) return records;

    return records.filter((record) => {
      const raw = record['updatedAt'];
      if (raw === null || raw === undefined) return true;
      const d = new Date(raw as string);
      return !isNaN(d.getTime()) && d > lastSyncTime;
    });
  }

  // ---------------------------------------------------------------------------
  // CORE TABLE SYNC — dùng chung cho cả 2 pipeline
  // ---------------------------------------------------------------------------

  /**
   * Đồng bộ 1 bảng theo syncStrategy được cấu hình trong Schema Registry:
   *
   *  • "upsert"      (mặc định) — Fetch all, upsert tất cả records.
   *  • "incremental"            — Fetch all pages từ source, nhưng chỉ upsert
   *                               records có updatedAt > lastSyncTime (filter tại BE).
   *                               Lần đầu (lastSyncTime = null) → full load.
   *  • "overwrite"              — Fetch all, DELETE toàn bộ bảng, INSERT lại.
   *                               Dành cho bảng DM nhỏ để đảm bảo destination = source 100%.
   */
  private async syncOneTable(
    schema: any,
    baseUrl: string,
    token: string,
  ): Promise<{ synced: number; skipped: number }> {
    const strategy: string = schema.syncStrategy || 'upsert';
    const primaryKey: string = schema.primaryKey?.[0];
    const lastSyncTime: Date | null = schema.lastSyncTime
      ? new Date(schema.lastSyncTime)
      : null;
    // TESTCASE
    const profiler = new MemoryProfiler();
    profiler.start(300);

    // try {
    if (!primaryKey && strategy !== 'overwrite') {
      throw new Error(
        `No primary key configured for table ${schema.tableName}.`,
      );
    }

    // Backup snapshot hiện tại trước khi ghi đè — chỉ bảng stable
    this.broadcastLog(
      `[BACKUP] Tạo pre-sync snapshot cho "${schema.tableName}"...`,
    );
    await this.backupService.backupTable(schema.tableName, 'pre-sync');

    this.broadcastLog(
      `[STRATEGY: ${strategy.toUpperCase()}] ${schema.tableName}${
        strategy === 'incremental' && lastSyncTime
          ? ` — server-side filter updatedAfter=${lastSyncTime.toISOString()}`
          : strategy === 'incremental'
            ? ' — lần đầu, full load (không filter updatedAfter)'
            : ''
      }`,
    );

    let currentPage = 1;
    let totalPages = 1;
    let totalSynced = 0;
    let totalSkipped = 0;

    // Dùng cho overwrite: gom toàn bộ records từ mọi trang trước khi ghi
    const allRecordsForOverwrite: Record<string, unknown>[] = [];

    // Thu thập source IDs để detect orphans (chỉ cho upsert/incremental)
    const sourceIds = new Set<unknown>();

    do {
      const separator = schema.dataFromApi.includes('?') ? '&' : '?';
      const tokenParam = token ? `&accessToken=${token}` : '';
      const updatedAfterParam =
        strategy === 'incremental' && lastSyncTime
          ? `&updatedAfter=${encodeURIComponent(lastSyncTime.toISOString())}`
          : '';
      const paginatedUrl = `${baseUrl}${schema.dataFromApi}${separator}page=${currentPage}&limit=${this.BATCH_LIMIT}${tokenParam}${updatedAfterParam}`;

      this.broadcastLog(
        `Fetching page ${currentPage}/${totalPages} -> ${paginatedUrl}`,
      );

      // Fetch với retry
      const response = await this.withRetry(
        () =>
          firstValueFrom(
            this.httpService.request({
              method: schema.dataFromMethod || 'GET',
              url: paginatedUrl,
              timeout: 100000,
            }),
          ),
        `${schema.tableName} page ${currentPage}`,
      );

      const responseData = response.data as SourceApiResponse;

      // [Guard] API Contract Validation
      if (
        !responseData ||
        responseData.success !== true ||
        !responseData.payload ||
        !Array.isArray(responseData.payload)
      ) {
        throw new Error(
          '[API CONTRACT VIOLATION] Dữ liệu trả về sai định dạng chuẩn. Yêu cầu phải có "success: true" và mảng "payload".',
        );
      }

      const rawDataArray = responseData.payload;
      const meta = responseData.metadata || {};

      // [Guard] Schema Contract — kiểm tra payload không có field lạ so với schema.details
      // createdAt/updatedAt là system timestamps của Prisma, luôn được bỏ qua
      if (schema.details?.length > 0 && rawDataArray.length > 0) {
        const SYSTEM_FIELDS = new Set(['createdAt', 'updatedAt']);
        const definedFields = new Set<string>(
          schema.details.map((d: any) => d.name),
        );
        const unknownFields = new Set<string>();
        for (const record of rawDataArray) {
          for (const key of Object.keys(record)) {
            if (!definedFields.has(key) && !SYSTEM_FIELDS.has(key)) {
              unknownFields.add(key);
            }
          }
        }
        if (unknownFields.size > 0) {
          throw new Error(
            `[SCHEMA CONTRACT VIOLATION] Payload có field chưa định nghĩa trong metadata: [${[...unknownFields].join(', ')}]. Bỏ qua sync toàn bộ bảng.`,
          );
        }
      }

      // [Guard] Page Mismatch
      if (meta.currentPage && meta.currentPage !== currentPage) {
        this.broadcastLog(
          `[PAGE MISMATCH] Expected page ${currentPage}, got ${meta.currentPage}. Skipping.`,
          'WARN',
        );
        break;
      }

      // Ghi nhận totalPages từ trang đầu tiên
      if (currentPage === 1 && meta.totalPages) {
        totalPages = meta.totalPages;
        this.broadcastLog(
          `Table ${schema.tableName} has ${meta.totalRecords} records across ${totalPages} pages.`,
        );
      }

      // [Guard] Empty payload
      if (rawDataArray.length === 0) {
        this.broadcastLog(
          `Page ${currentPage} is empty. Stopping pagination for ${schema.tableName}.`,
          'WARN',
        );
        break;
      }

      // Thu thập source IDs từ mỗi page (bỏ qua overwrite vì DELETE+INSERT tự xử lý)
      if (strategy !== 'overwrite' && primaryKey) {
        for (const record of rawDataArray) {
          const pk = record[primaryKey];
          if (pk !== undefined && pk !== null) sourceIds.add(pk);
        }
      }

      // Xử lý theo strategy
      if (strategy === 'overwrite') {
        // Thu thập tất cả records — sẽ ghi một lần sau vòng lặp
        allRecordsForOverwrite.push(...rawDataArray);
      } else if (strategy === 'incremental') {
        // Source API đã lọc server-side qua updatedAfter — upsert thẳng toàn bộ payload
        this.broadcastLog(
          `[INCREMENTAL] Page ${currentPage}: ${rawDataArray.length} records thay đổi từ source — upsert.`,
        );
        await this.syncEngine.syncTableData(
          schema.tableName,
          rawDataArray,
          primaryKey,
        );
        totalSynced += rawDataArray.length;
      } else {
        // upsert (mặc định) — sync toàn bộ
        this.broadcastLog(
          `Syncing ${rawDataArray.length} records to database...`,
        );
        await this.syncEngine.syncTableData(
          schema.tableName,
          rawDataArray,
          primaryKey,
        );
        totalSynced += rawDataArray.length;
      }

      currentPage++;
    } while (currentPage <= totalPages);

    // Ghi overwrite một lần sau khi fetch xong tất cả pages
    if (strategy === 'overwrite' && allRecordsForOverwrite.length > 0) {
      this.broadcastLog(
        `[OVERWRITE] Đã fetch xong ${allRecordsForOverwrite.length} records — tiến hành xóa và ghi lại toàn bộ bảng.`,
      );
      await this.syncEngine.overwriteTableData(
        schema.tableName,
        allRecordsForOverwrite,
      );
      totalSynced = allRecordsForOverwrite.length;
    }

    // [Orphan Detection] Phát hiện records tồn tại ở destination nhưng không còn ở source
    // Chỉ chạy cho upsert/incremental (overwrite tự xử lý bằng DELETE+INSERT)
    if (strategy !== 'overwrite' && primaryKey && sourceIds.size > 0) {
      const orphanIds = await this.syncEngine.detectOrphans(
        schema.tableName,
        primaryKey,
        sourceIds,
      );
      if (orphanIds.length > 0) {
        this.broadcastLog(
          `[ORPHAN DETECTED] Bảng "${schema.tableName}": ${orphanIds.length} records tồn tại ở destination nhưng không có trong source. IDs: [${orphanIds.slice(0, 20).join(', ')}${orphanIds.length > 20 ? `, ...và ${orphanIds.length - 20} records khác` : ''}]`,
          'WARN',
        );
      } else {
        this.broadcastLog(
          `[ORPHAN CHECK] Bảng "${schema.tableName}": không phát hiện orphan records.`,
        );
      }
    }

    // Cập nhật lastSyncTime sau khi sync thành công
    await this.schemaRegistry.updateLastSyncTime(schema.tableName, new Date());

    return { synced: totalSynced, skipped: totalSkipped };
    // } finally {
    //   const mem = profiler.stop();
    //   this.broadcastLog(
    //     `[MEMORY] ${schema.tableName}: peak=${mem.peakMB}MB, base=${mem.baseMB}MB, delta=${mem.deltaRSS}MB`,
    //   );
    // }
  }

  // ---------------------------------------------------------------------------
  // PUBLIC PIPELINES
  // ---------------------------------------------------------------------------

  async runFullIntegrationPipeline() {
    this.broadcastLog('--- STARTING FULL INTEGRATION PIPELINE ---');
    const runLog = await this.eventLogService.createJobLog(
      'Full Integration Sync',
      'FULL_SYNC',
      'sync',
    );

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

      const baseUrl =
        this.configService.get<string>('SOURCE_API_BASE_URL') ?? '';
      const token = this.configService.get<string>('SOURCE_API_TOKEN', '');
      const syncResults: TableSyncResult[] = [];

      for (const schema of schemasToSync) {
        this.broadcastLog(`[START] Processing table: ${schema.tableName}...`);

        // Guard: bỏ qua endpoint detect-schema
        if (!schema.dataFromApi) {
          syncResults.push({
            table: schema.tableName,
            status: 'failed',
            error: 'No dataFromApi defined.',
          });
          continue;
        }
        if (schema.dataFromApi.includes('check-all-schemas')) {
          this.broadcastLog(
            `Skipping ${schema.tableName} - endpoint detect-schema.`,
            'WARN',
          );
          syncResults.push({
            table: schema.tableName,
            status: 'failed',
            error: 'No real data endpoint configured',
          });
          continue;
        }

        try {
          const { synced, skipped } = await this.syncOneTable(
            schema,
            baseUrl,
            token,
          );
          syncResults.push({
            table: schema.tableName,
            status: 'success',
            totalRecordsSynced: synced,
            skipped,
          });
          this.broadcastLog(
            `[DONE] ${schema.tableName}: synced=${synced}, skipped(unchanged)=${skipped}.`,
          );
        } catch (error: any) {
          this.broadcastLog(
            `[ERROR] ${schema.tableName}: ${error.message}`,
            'WARN',
          );
          syncResults.push({
            table: schema.tableName,
            status: 'failed',
            error: error.message,
          });
        }
      }

      const successRecords = syncResults
        .filter((r): r is TableSyncSuccessResult => r.status === 'success')
        .reduce((sum, r) => sum + r.totalRecordsSynced, 0);
      const failedCount = syncResults.filter(
        (r) => r.status === 'failed',
      ).length;
      const successCount = syncResults.filter(
        (r) => r.status === 'success',
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
          .filter((r): r is TableSyncFailedResult => r.status === 'failed')
          .map((r) => r.error),
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
        new Set((tableNames || []).map((n) => n?.trim()).filter(Boolean)),
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
          ['No table names provided'],
        );
        this.broadcastLog(
          'No table names provided. Aborting custom sync.',
          'WARN',
        );
        return { message: 'No table names provided' };
      }

      const allSchemas = await this.schemaRegistry.getAllSchema();
      const stableSchemaMap = new Map(
        allSchemas
          .filter((s) => s.status === 'stable')
          .map((s) => [s.tableName, s]),
      );

      const schemasToSync = normalizedTableNames
        .map((t) => stableSchemaMap.get(t))
        .filter((s): s is NonNullable<typeof s> => Boolean(s));

      const missingTables = normalizedTableNames.filter(
        (t) => !stableSchemaMap.has(t),
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
            ? [`No matching stable schemas for: ${missingTables.join(', ')}`]
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
          `Skipping ${missingTables.length} tables not found or not stable: ${missingTables.join(', ')}`,
          'WARN',
        );
      }

      const baseUrl =
        this.configService.get<string>('SOURCE_API_BASE_URL') ?? '';
      const token = this.configService.get<string>('SOURCE_API_TOKEN', '');
      const syncResults: TableSyncResult[] = [];

      for (const schema of schemasToSync) {
        this.broadcastLog(`[START] Processing table: ${schema.tableName}...`);

        if (!schema.dataFromApi) {
          syncResults.push({
            table: schema.tableName,
            status: 'failed',
            error: 'No dataFromApi defined.',
          });
          continue;
        }

        try {
          const { synced, skipped } = await this.syncOneTable(
            schema,
            baseUrl,
            token,
          );
          syncResults.push({
            table: schema.tableName,
            status: 'success',
            totalRecordsSynced: synced,
            skipped,
          });
          this.broadcastLog(
            `[DONE] ${schema.tableName}: synced=${synced}, skipped(unchanged)=${skipped}.`,
          );
        } catch (error: any) {
          this.broadcastLog(
            `[ERROR] ${schema.tableName}: ${error.message}`,
            'WARN',
          );
          syncResults.push({
            table: schema.tableName,
            status: 'failed',
            error: error.message,
          });
        }
      }

      const successRecords = syncResults
        .filter((r): r is TableSyncSuccessResult => r.status === 'success')
        .reduce((sum, r) => sum + r.totalRecordsSynced, 0);
      const failedCount = syncResults.filter(
        (r) => r.status === 'failed',
      ).length;
      const successCount = syncResults.filter(
        (r) => r.status === 'success',
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
            .filter((r): r is TableSyncFailedResult => r.status === 'failed')
            .map((r) => `[${r.table}] ${r.error}`),
          ...(missingTables.length > 0
            ? [`Missing or unstable tables: ${missingTables.join(', ')}`]
            : []),
        ],
      );

      this.broadcastLog('--- CUSTOM INTEGRATION PIPELINE FINISHED ---');
      return {
        requestedTables: normalizedTableNames,
        syncedTables: schemasToSync.map((s) => s.tableName),
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

  // ---------------------------------------------------------------------------
  // ORPHAN MANAGEMENT
  // ---------------------------------------------------------------------------

  /**
   * Scan: fetch all pages từ source, so sánh với destination, trả về orphan IDs.
   * Không xóa gì cả — chỉ đọc (safe to call anytime).
   */
  async scanOrphans(tableNames: string[]): Promise<
    Array<{
      tableName: string;
      primaryKey: string;
      orphanCount: number;
      orphanIds: unknown[];
      error?: string;
    }>
  > {
    const allSchemas = await this.schemaRegistry.getAllSchema();
    const schemaMap = new Map(allSchemas.map((s) => [s.tableName, s]));
    const baseUrl = this.configService.get<string>('SOURCE_API_BASE_URL') ?? '';
    const token = this.configService.get<string>('SOURCE_API_TOKEN', '');
    const results: Array<{
      tableName: string;
      primaryKey: string;
      orphanCount: number;
      orphanIds: unknown[];
      error?: string;
    }> = [];

    for (const tableName of tableNames) {
      const schema = schemaMap.get(tableName);
      if (!schema) {
        results.push({
          tableName,
          primaryKey: '',
          orphanCount: 0,
          orphanIds: [],
          error: 'Schema not found',
        });
        continue;
      }
      const primaryKey = schema.primaryKey?.[0];
      if (!primaryKey) {
        results.push({
          tableName,
          primaryKey: '',
          orphanCount: 0,
          orphanIds: [],
          error: 'No primary key configured',
        });
        continue;
      }

      try {
        const sourceIds = new Set<unknown>();
        let currentPage = 1;
        let totalPages = 1;

        do {
          const separator = schema.dataFromApi.includes('?') ? '&' : '?';
          const url = `${baseUrl}${schema.dataFromApi}${separator}page=${currentPage}&limit=${this.BATCH_LIMIT}${token ? `&accessToken=${token}` : ''}`;
          const response = await this.withRetry(
            () =>
              firstValueFrom(
                this.httpService.request({
                  method: schema.dataFromMethod || 'GET',
                  url,
                  timeout: 100000,
                }),
              ),
            `scan-orphans ${tableName} page ${currentPage}`,
          );
          const data = response.data;
          if (!data?.payload || !Array.isArray(data.payload)) break;
          if (currentPage === 1 && data.metadata?.totalPages)
            totalPages = data.metadata.totalPages;

          for (const record of data.payload) {
            const pk = record[primaryKey];
            if (pk !== undefined && pk !== null) sourceIds.add(pk);
          }
          currentPage++;
        } while (currentPage <= totalPages);

        const orphanIds = await this.syncEngine.detectOrphans(
          tableName,
          primaryKey,
          sourceIds,
        );
        results.push({
          tableName,
          primaryKey,
          orphanCount: orphanIds.length,
          orphanIds,
        });
        this.broadcastLog(
          orphanIds.length > 0
            ? `[SCAN ORPHANS] "${tableName}": ${orphanIds.length} orphan(s) phát hiện.`
            : `[SCAN ORPHANS] "${tableName}": sạch, không có orphan.`,
          orphanIds.length > 0 ? 'WARN' : 'INFO',
        );
      } catch (error: any) {
        results.push({
          tableName,
          primaryKey,
          orphanCount: 0,
          orphanIds: [],
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Purge: xóa các records theo danh sách IDs do admin xác nhận.
   * Admin phải tự cung cấp IDs (lấy từ kết quả scan-orphans) — không auto-detect ở đây.
   */
  async purgeOrphans(
    tableName: string,
    primaryKey: string,
    ids: unknown[],
  ): Promise<{ deleted: number }> {
    if (!ids || ids.length === 0) return { deleted: 0 };

    const log = await this.eventLogService.createJobLog(
      `Purge Orphans: ${tableName}`,
      'purge_orphans',
      'manual',
    );

    try {
      const deleted = await this.syncEngine.deleteRecordsByIds(
        tableName,
        primaryKey,
        ids,
      );
      await this.eventLogService.finishJobLog(
        log._id as unknown as string,
        'done',
        {
          tableName,
          primaryKey,
          requestedIds: ids.length,
          deleted,
          deletedIds: ids,
        },
        [],
      );
      this.broadcastLog(
        `[PURGE ORPHANS] "${tableName}": đã xóa ${deleted}/${ids.length} records.`,
        'WARN',
      );
      return { deleted };
    } catch (error: any) {
      await this.eventLogService.finishJobLog(
        log._id as unknown as string,
        'failed',
        { tableName },
        [error.message],
      );
      throw error;
    }
  }
}
