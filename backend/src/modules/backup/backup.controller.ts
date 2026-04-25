import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { BackupService } from './backup.service';
import { TriggerBackupDto } from './dto/trigger-backup.dto';
import { RestoreBackupDto } from './dto/restore-backup.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SchemaRegistryService } from 'src/common/schema-registry/schema-registry.service';

@Controller('backup')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class BackupController {
  constructor(
    private readonly backupService: BackupService,
    private readonly schemaRegistry: SchemaRegistryService,
  ) {}

  /**
   * Manual backup — một hoặc nhiều bảng.
   * Nếu không truyền tables → backup tất cả stable tables.
   */
  @Post('trigger')
  async triggerManualBackup(@Body() body: TriggerBackupDto) {
    if (body.tables && body.tables.length > 0) {
      const results: Record<string, string | null> = {};
      for (const table of body.tables) {
        results[table] = await this.backupService.backupTable(table, 'manual');
      }
      return { message: 'Manual backup completed', results };
    }
    const result = await this.backupService.backupAllStable('manual');
    return { message: 'Manual backup all stable tables completed', ...result };
  }

  /**
   * Liệt kê backup files trong MinIO.
   * Query param: ?prefix=scheduled/ hoặc ?prefix=schema-change/nguoi_hoc/
   */
  @Get('list')
  async listBackups(@Query('prefix') prefix?: string) {
    const backups = await this.backupService.listBackups(prefix);
    return { count: backups.length, backups };
  }

  /**
   * Lấy presigned URL để download 1 file backup.
   * Query param: ?key=scheduled/nguoi_hoc/2026-04-20T02-00-00-000Z.json
   */
  @Get('download')
  async getDownloadUrl(@Query('key') key: string) {
    const url = await this.backupService.getDownloadUrl(key);
    return { url, expiresIn: '1 hour' };
  }

  /**
   * Restore một bảng từ file backup về PostgreSQL.
   * Body: { "key": "pre-sync/nguoi_hoc/2026-04-23T05-00-45-710Z.json" }
   *
   * Flow: tải JSON từ MinIO → snapshot hiện tại → DELETE all → INSERT all
   */
  @Post('restore')
  async restoreBackup(@Body() body: RestoreBackupDto) {
    const result = await this.backupService.restoreFromBackup(body.key);
    return {
      message: `Restore bảng "${result.tableName}" thành công.`,
      ...result,
    };
  }

  /**
   * Trigger cleanup thủ công (xóa backup quá hạn).
   */
  @Post('cleanup')
  async triggerCleanup() {
    await this.backupService.cleanupOldBackups();
    return { message: 'Cleanup completed' };
  }
}
