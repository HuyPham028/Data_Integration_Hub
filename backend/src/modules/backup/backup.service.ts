import { Injectable, Logger, BadRequestException, NotFoundException, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { OnEvent } from '@nestjs/event-emitter';
import { MinioService } from './minio.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { SchemaRegistryService } from 'src/common/schema-registry/schema-registry.service';

type BackupTrigger = 'scheduled' | 'schema-change' | 'manual' | 'pre-sync';

const BACKUP_TRIGGERS: BackupTrigger[] = ['scheduled', 'manual', 'pre-sync', 'schema-change'];

const DEFAULT_RETENTION: Record<BackupTrigger, number | null> = {
  scheduled: 60,
  manual: 30,
  'pre-sync': 30,
  'schema-change': null,
};

@Injectable()
export class BackupService implements OnModuleInit {
  private readonly logger = new Logger(BackupService.name);

  constructor(
    private readonly minio: MinioService,
    private readonly prisma: PrismaService,
    private readonly schemaRegistry: SchemaRegistryService,
  ) {}

  async onModuleInit() {
    for (const trigger of BACKUP_TRIGGERS) {
      await this.prisma.backupRetentionPolicy.upsert({
        where: { trigger },
        update: {},
        create: { trigger, days: DEFAULT_RETENTION[trigger] },
      });
    }
    this.logger.log('[BACKUP] Retention policy defaults seeded.');
  }

  // ---------------------------------------------------------------------------
  // RETENTION POLICY API
  // ---------------------------------------------------------------------------

  async getRetentionPolicies() {
    return this.prisma.backupRetentionPolicy.findMany();
  }

  async updateRetentionPolicy(trigger: string, days: number | null) {
    if (!BACKUP_TRIGGERS.includes(trigger as BackupTrigger)) {
      throw new BadRequestException(`Trigger không hợp lệ: "${trigger}". Hợp lệ: ${BACKUP_TRIGGERS.join(', ')}`);
    }
    return this.prisma.backupRetentionPolicy.update({
      where: { trigger },
      data: { days },
    });
  }

  private async getRetentionMap(): Promise<Record<string, number | null>> {
    const policies = await this.prisma.backupRetentionPolicy.findMany();
    return Object.fromEntries(policies.map((p) => [p.trigger, p.days]));
  }

  // ---------------------------------------------------------------------------
  // CORE
  // ---------------------------------------------------------------------------

  /**
   * Backup 1 bảng lên MinIO dưới dạng JSON.
   * objectKey pattern: {trigger}/{tableName}/{ISO-timestamp}.json
   */
  async backupTable(tableName: string, trigger: BackupTrigger): Promise<string | null> {
    const modelName = this.getPrismaModelName(tableName);
    if (!this.prisma[modelName]) {
      this.logger.warn(`[BACKUP] Model "${modelName}" không tồn tại trong Prisma — bỏ qua.`);
      return null;
    }

    try {
      const records = await this.prisma[modelName].findMany();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const objectKey = `${trigger}/${tableName}/${timestamp}.json`;

      const payload = {
        meta: {
          tableName,
          trigger,
          backedUpAt: new Date().toISOString(),
          recordCount: records.length,
        },
        data: records,
      };

      await this.minio.uploadJson(objectKey, payload);
      this.logger.log(`[BACKUP] "${tableName}" → MinIO: ${objectKey} (${records.length} records)`);
      return objectKey;
    } catch (err) {
      this.logger.error(`[BACKUP] Lỗi backup "${tableName}": ${err.message}`);
      return null;
    }
  }

  /**
   * Backup tất cả bảng có status = 'stable'.
   */
  async backupAllStable(trigger: BackupTrigger): Promise<{ success: string[]; failed: string[] }> {
    const schemas = await this.schemaRegistry.getAllSchema();
    const stableSchemas = schemas.filter((s) => s.status === 'stable');

    const success: string[] = [];
    const failed: string[] = [];

    for (const schema of stableSchemas) {
      const key = await this.backupTable(schema.tableName, trigger);
      if (key) success.push(schema.tableName);
      else failed.push(schema.tableName);
    }

    this.logger.log(`[BACKUP ALL] Trigger: ${trigger} | Success: ${success.length}, Failed: ${failed.length}`);
    return { success, failed };
  }

  // ---------------------------------------------------------------------------
  // SCHEDULED — mỗi chủ nhật 2:00 AM
  // ---------------------------------------------------------------------------

  @Cron('0 2 * * 0')
  async handleWeeklyBackup() {
    this.logger.log('[BACKUP SCHEDULED] Bắt đầu weekly backup...');
    await this.backupAllStable('scheduled');
    await this.cleanupOldBackups();
  }

  // ---------------------------------------------------------------------------
  // EVENT-DRIVEN — schema thay đổi
  // ---------------------------------------------------------------------------

  @OnEvent('schema.changed')
  async handleSchemaChanged(payload: { tableName: string }) {
    this.logger.warn(`[BACKUP SCHEMA-CHANGE] Schema "${payload.tableName}" thay đổi — tạo snapshot...`);
    await this.backupTable(payload.tableName, 'schema-change');
  }

  // ---------------------------------------------------------------------------
  // RETENTION CLEANUP
  // ---------------------------------------------------------------------------

  /**
   * Xóa backup cũ theo retention policy.
   * Chạy sau mỗi weekly backup, có thể gọi thủ công.
   */
  async cleanupOldBackups(): Promise<void> {
    this.logger.log('[BACKUP CLEANUP] Bắt đầu dọn dẹp backup cũ...');
    let totalDeleted = 0;
    const retentionMap = await this.getRetentionMap();

    for (const [trigger, retentionDays] of Object.entries(retentionMap)) {
      if (retentionDays === null) continue; // schema-change giữ vĩnh viễn

      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - retentionDays);

      const objects = await this.minio.listObjects(`${trigger}/`);
      const toDelete = objects
        .filter((obj) => obj.lastModified && new Date(obj.lastModified) < cutoff)
        .map((obj) => obj.name)
        .filter((name): name is string => !!name);

      if (toDelete.length > 0) {
        await this.minio.deleteObjects(toDelete);
        this.logger.log(`[BACKUP CLEANUP] "${trigger}": xóa ${toDelete.length} file cũ hơn ${retentionDays} ngày.`);
        totalDeleted += toDelete.length;
      }
    }

    this.logger.log(`[BACKUP CLEANUP] Hoàn thành. Tổng đã xóa: ${totalDeleted} file.`);
  }

  // ---------------------------------------------------------------------------
  // QUERY HELPERS
  // ---------------------------------------------------------------------------

  async listBackups(prefix?: string): Promise<
    Array<{ key: string; size: number; lastModified: Date; expiresAt: Date | null }>
  > {
    const [objects, retentionMap] = await Promise.all([
      this.minio.listObjects(prefix ?? ''),
      this.getRetentionMap(),
    ]);
    return objects
      .filter((o) => o.name)
      .map((o) => {
        const lastModified = o.lastModified ?? new Date(0);
        const trigger = o.name!.split('/')[0];
        const retentionDays = retentionMap[trigger] ?? null;
        const expiresAt =
          retentionDays !== null
            ? new Date(lastModified.getTime() + retentionDays * 24 * 60 * 60 * 1000)
            : null;
        return { key: o.name!, size: o.size ?? 0, lastModified, expiresAt };
      })
      .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  }

  async getDownloadUrl(objectKey: string): Promise<string> {
    return this.minio.getPresignedUrl(objectKey, 3600);
  }

  async deleteBackup(objectKey: string): Promise<void> {
    await this.minio.deleteObject(objectKey);
    this.logger.log(`[BACKUP DELETE] Đã xóa file: ${objectKey}`);
  }

  /**
   * Restore một bảng từ file backup trên MinIO về PostgreSQL.
   * Dùng overwrite strategy: DELETE all → INSERT all trong 1 transaction.
   *
   * @param objectKey  key MinIO, ví dụ "pre-sync/nguoi_hoc/2026-04-23T05-00-45-710Z.json"
   */
  async restoreFromBackup(objectKey: string): Promise<{
    tableName: string;
    restoredRecords: number;
    backedUpAt: string;
    trigger: string;
  }> {
    // 1. Tải file JSON từ MinIO
    let backupFile: { meta: any; data: any[] };
    try {
      backupFile = await this.minio.downloadJson<{ meta: any; data: any[] }>(objectKey);
    } catch (err) {
      throw new NotFoundException(`Không tìm thấy backup file "${objectKey}": ${err.message}`);
    }

    const { meta, data } = backupFile;
    if (!meta?.tableName || !Array.isArray(data)) {
      throw new BadRequestException(`File backup "${objectKey}" không đúng định dạng.`);
    }

    const { tableName, backedUpAt, trigger } = meta;
    this.logger.warn(
      `[RESTORE] Bắt đầu restore bảng "${tableName}" từ backup "${objectKey}" (${data.length} records)...`,
    );

    // 2. Tạo snapshot hiện tại trước khi ghi đè — an toàn
    await this.backupTable(tableName, 'manual');
    this.logger.log(`[RESTORE] Đã tạo pre-restore snapshot cho "${tableName}".`);

    // 3. Restore: DELETE all → batch INSERT (không dùng 1 transaction bọc tất cả
    //    vì 68k+ records vượt Prisma interactive transaction timeout 5000ms)
    const modelName = this.getPrismaModelName(tableName);
    if (!this.prisma[modelName]) {
      throw new BadRequestException(`Model "${modelName}" không tồn tại trong Prisma.`);
    }

    await this.prisma[modelName].deleteMany({});
    this.logger.log(`[RESTORE] Đã xóa toàn bộ dữ liệu hiện tại của "${tableName}".`);

    const BATCH_SIZE = 1000;
    let inserted = 0;
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      const batch = data.slice(i, i + BATCH_SIZE);
      await this.prisma[modelName].createMany({ data: batch, skipDuplicates: true });
      inserted += batch.length;
      this.logger.log(`[RESTORE] "${tableName}": ${inserted}/${data.length} records...`);
    }

    this.logger.warn(
      `[RESTORE] Hoàn thành restore bảng "${tableName}": ${inserted} records từ backup lúc ${backedUpAt}.`,
    );

    return {
      tableName,
      restoredRecords: inserted,
      backedUpAt,
      trigger,
    };
  }

  private getPrismaModelName(tableName: string): string {
    return tableName.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
  }
}
