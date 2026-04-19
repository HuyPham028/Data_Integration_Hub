import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
   * Lấy danh sách scalar fields hợp lệ từ Prisma DMMF (loại bỏ relation fields).
   * Dùng để lọc fields lạ từ source API trước khi upsert — tránh "Unknown field" error.
   */
  private getValidScalarFields(modelName: string): Set<string> | null {
    const pascalName = modelName.charAt(0).toUpperCase() + modelName.slice(1);
    const modelDmmf = Prisma.dmmf.datamodel.models.find(m => m.name === pascalName);
    if (!modelDmmf) return null;
    return new Set(modelDmmf.fields.filter(f => f.kind === 'scalar').map(f => f.name));
  }

  /**
   * Normalize kiểu dữ liệu từ source:
   * - String ISO date → Date object
   * - Số nguyên trả về dạng string → number
   *
   * Giải quyết: Type Coercion Collision (implicit casting từ API JSON)
   */
  private normalizeRecord(record: any, modelName: string): any {
    const pascalName = modelName.charAt(0).toUpperCase() + modelName.slice(1);
    const modelDmmf = Prisma.dmmf.datamodel.models.find(m => m.name === pascalName);
    if (!modelDmmf) return record;

    const normalized = { ...record };
    for (const field of modelDmmf.fields) {
      const val = normalized[field.name];
      if (val === undefined || val === null) continue;

      if (field.type === 'DateTime' && typeof val === 'string') {
        const d = new Date(val);
        normalized[field.name] = isNaN(d.getTime()) ? null : d;
      } else if (field.type === 'Int' && typeof val === 'string') {
        const n = parseInt(val, 10);
        normalized[field.name] = isNaN(n) ? null : n;
      } else if (field.type === 'Float' && typeof val === 'string') {
        const f = parseFloat(val);
        normalized[field.name] = isNaN(f) ? null : f;
      } else if (field.type === 'Boolean' && typeof val === 'string') {
        normalized[field.name] = val === 'true' || val === '1';
      }
    }
    return normalized;
  }

  /**
   * Dedup records theo primary key trước khi upsert.
   * Nếu source có 2 record cùng PK, chỉ giữ record cuối cùng.
   * Records có PK null/undefined KHÔNG bị drop ở đây — được giữ lại để
   * upsert loop bắt lỗi và ghi vào Dead Letter Log (không drop silently).
   *
   * Giải quyết: Duplicate Source Records (Primary Key / Uniqueness Violations)
   */
  private deduplicate(dataArray: any[], primaryKeyColumn: string): any[] {
    const seen = new Map<any, any>();
    const nullPkRecords: any[] = [];

    for (const record of dataArray) {
      const pk = record[primaryKeyColumn];
      if (pk !== undefined && pk !== null) {
        seen.set(pk, record); // giữ record cuối nếu trùng
      } else {
        nullPkRecords.push(record); // giữ lại để dead-letter trong upsert loop
      }
    }

    const dupCount = dataArray.length - seen.size - nullPkRecords.length;
    if (dupCount > 0) {
      this.logger.warn(`[DEDUP] ${dupCount} duplicate records removed (pk: ${primaryKeyColumn})`);
    }
    if (nullPkRecords.length > 0) {
      this.logger.warn(`[DEDUP] ${nullPkRecords.length} records with null/undefined PK detected — will be dead-lettered`);
    }

    return [...Array.from(seen.values()), ...nullPkRecords];
  }

  /**
   * @param tableName   Tên bảng PostgreSQL (snake_case)
   * @param dataArray   Mảng records từ source API
   * @param primaryKeyColumn  Tên cột primary key dùng để upsert
   */
  async syncTableData(tableName: string, dataArray: any[], primaryKeyColumn: string) {
    const modelName = this.getPrismaModelName(tableName);

    // [Guard] Model phải tồn tại trong Prisma
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

    // [Collision Defense 1] Schema filter — loại bỏ field lạ không có trong Prisma schema
    const validFields = this.getValidScalarFields(modelName);

    // [Collision Defense 2] Dedup — loại bỏ record trùng PK trong cùng 1 batch
    const dedupedArray = this.deduplicate(dataArray, primaryKeyColumn);

    for (const record of dedupedArray) {
      try {
        // Kiểm tra PK tồn tại trên raw record trước (cho Dead Letter log dùng giá trị gốc)
        const rawPkValue = record[primaryKeyColumn];

        if (rawPkValue === undefined || rawPkValue === null) {
          throw new Error(`Missing primary key (${primaryKeyColumn}) in record`);
        }

        // [Collision Defense 1] Lọc field không hợp lệ
        const filteredRecord = validFields
          ? Object.fromEntries(Object.entries(record).filter(([k]) => validFields.has(k)))
          : record;

        // [Collision Defense 3] Type normalization — chuẩn hóa kiểu dữ liệu về đúng type trong schema
        const normalizedRecord = this.normalizeRecord(filteredRecord, modelName);

        // Đọc pkValue SAU normalize để where clause dùng đúng kiểu (Int/String/...)
        const pkValue = normalizedRecord[primaryKeyColumn];

        // Không update primary key (tránh PK conflict khi update)
        const { [primaryKeyColumn]: _pk, ...updateData } = normalizedRecord;

        // [Collision Defense 4] Idempotent upsert — an toàn khi chạy lại nhiều lần
        await this.prisma[modelName].upsert({
          where: { [primaryKeyColumn]: pkValue },
          update: updateData,
          create: normalizedRecord,
        });

        successCount++;
      } catch (error) {
        failedCount++;
        // [Collision Defense 5] Dead Letter: lưu record lỗi vào log thay vì drop silently
        errors.push({ pk: record[primaryKeyColumn], error: error.message });
        if (failedCount === 1) {
          this.logger.error(`[FIRST ERROR SAMPLE] pk=${record[primaryKeyColumn]} | ${error.message}`);
        }
      }
    }

    const finalStatus = failedCount === 0 ? 'done' : successCount > 0 ? 'partial_success' : 'failed';

    await this.eventLogService.finishJobLog(log._id as unknown as string, finalStatus, {
      totalToSync: dataArray.length,
      deduplicated: dataArray.length - dedupedArray.length,
      success: successCount,
      failed: failedCount,
    }, errors);

    this.logger.log(`Sync table ${tableName} finished. Success: ${successCount}, Failed: ${failedCount}`);
  }
}
