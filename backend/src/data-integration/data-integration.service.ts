import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { SchemaRegistryService } from 'src/common/schema-registry/schema-registry.service';
import { SyncEngineService } from 'src/modules/sync-engine/sync-engine.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

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
  ) {}

  private broadcastLog(message: string, type: 'INFO' | 'WARN' | 'ERROR' = 'INFO') {
    if (type == 'ERROR') this.logger.error(message)
    else if (type == 'WARN') this.logger.warn(message)
    else this.logger.log(message)

    this.eventEmitter.emit('sync.log', {
      timestamp: new Date().toISOString(),
      type,
      message,
    })
  }

  /**
   * Run full sync of all tables with Pagination & Strict API Contract
   */
  async runFullIntegrationPipeline() {
    this.broadcastLog('--- STARTING FULL INTEGRATION PIPELINE ---');

    // 1. Chỉ lấy các schema đang ở trạng thái an toàn (stable)
    const allSchemas = await this.schemaRegistry.getAllSchema();
    const schemasToSync = allSchemas.filter(s => s.status === 'stable');
    const skippedSchemas = allSchemas.filter(s => s.status !== 'stable');

    if (skippedSchemas.length > 0) {
      this.broadcastLog(`Skipping ${skippedSchemas.length} tables due to schema changes/new tables.`, 'WARN');
    }

    if (!schemasToSync || schemasToSync.length === 0) {
      this.broadcastLog('No stable schemas found. Aborting sync.', 'WARN');
      return { message: 'No tables ready for sync' };
    }

    const syncResults: TableSyncResult[] = [];

    // 2. Lặp qua từng bảng để xử lý
    for (const schema of schemasToSync) {
      this.broadcastLog(`[START] Processing table: ${schema.tableName}...`);

      let currentPage = 1;
      let totalPages = 1;
      let totalSyncedForTable = 0;

      try {
        const baseUrl = this.configService.get<string>('SOURCE_API_BASE_URL', 'http://localhost:3001');
        const token = this.configService.get<string>('SOURCE_API_TOKEN', '');

        if (!schema.dataFromApi) {
          throw new Error(`Skipping ${schema.tableName} - No dataFromApi defined.`);
        }

        // Bỏ qua endpoint detect-schema, không phải endpoint lấy data
        if (schema.dataFromApi.includes('check-all-schemas')) {
          this.broadcastLog(`Skipping ${schema.tableName} - dataFromApi trỏ vào endpoint detect-schema, chưa có endpoint data thật.`, 'WARN');
          syncResults.push({ table: schema.tableName, status: 'failed', error: 'No real data endpoint configured' });
          continue;
        }

        const primaryKey = schema.primaryKey[0];

        do {
          const separator = schema.dataFromApi.includes('?') ? '&' : '?';
          const tokenParam = token ? `&accessToken=${token}` : '';
          const paginatedUrl = `${baseUrl}${schema.dataFromApi}${separator}page=${currentPage}&limit=${this.BATCH_LIMIT}${tokenParam}`;
          
          this.broadcastLog(`Fetching page ${currentPage}/${totalPages} -> ${paginatedUrl}`);
          
          // 3. Gọi API ra hệ thống nguồn
          const response = await firstValueFrom(
            this.httpService.request({
              method: schema.dataFromMethod || 'GET',
              url: paginatedUrl,
              timeout: 10000,
            })
          );

          const responseData = response.data as SourceApiResponse;

          // 4. [Collision Defense] API Contract Validation — fail fast tại ingestion
          if (
            !responseData ||
            responseData.success !== true ||
            !responseData.payload ||
            !Array.isArray(responseData.payload)
          ) {
            throw new Error(
              `[API CONTRACT VIOLATION] Dữ liệu trả về sai định dạng chuẩn. Yêu cầu phải có "success: true" và mảng "payload".`
            );
          }

          const rawDataArray = responseData.payload;
          const meta = responseData.metadata || {};

          // [Collision Defense] Out-of-order / late page guard:
          // Nếu server trả currentPage khác với page đang fetch → bỏ qua trang này
          if (meta.currentPage && meta.currentPage !== currentPage) {
            this.broadcastLog(
              `[PAGE MISMATCH] Expected page ${currentPage}, got ${meta.currentPage}. Skipping.`,
              'WARN'
            );
            break;
          }

          // Cập nhật tổng số trang từ lần gọi đầu tiên
          if (currentPage === 1 && meta.totalPages) {
            totalPages = meta.totalPages;
            this.broadcastLog(`Table ${schema.tableName} has ${meta.totalRecords} records across ${totalPages} pages.`);
          }

          // Thoát vòng lặp nếu API trả về mảng rỗng (Tránh lặp vô hạn nếu API nguồn lỗi logic)
          if (rawDataArray.length === 0) {
             this.broadcastLog(`Page ${currentPage} is empty. Stopping pagination for ${schema.tableName}.`, 'WARN');
             break;
          }

          // 5. Đẩy data (tối đa 5000 records) vào Sync Engine để lưu xuống PostgreSQL
          this.broadcastLog(`Syncing ${rawDataArray.length} records to database...`);
          await this.syncEngine.syncTableData(
            schema.tableName, 
            rawDataArray, 
            primaryKey
          );

          totalSyncedForTable += rawDataArray.length;
          
          // Chuyển sang trang tiếp theo
          currentPage++;

        } while (currentPage <= totalPages);

        // Kết thúc vòng lặp thành công cho bảng này
        syncResults.push({ 
          table: schema.tableName, 
          status: 'success', 
          totalRecordsSynced: totalSyncedForTable 
        });
        this.broadcastLog(`[DONE] Successfully synced ${totalSyncedForTable} records for ${schema.tableName}.`);

      } catch (error) {
        this.broadcastLog(`[ERROR] Failed to integrate table ${schema.tableName}: ${error.message}`, 'WARN');
        syncResults.push({ table: schema.tableName, status: 'failed', error: error.message });
        // Lỗi 1 bảng thì bỏ qua, đi tiếp bảng tiếp theo trong mảng schemasToSync
      }
    }

    this.broadcastLog('--- FULL INTEGRATION PIPELINE FINISHED ---');
    return syncResults;
  }
}