import { Controller, Post, Body, Query } from '@nestjs/common';
import { SyncService } from './sync.service';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  /*
   * Endpoint Example: POST /sync/master-data?table=dm_gioi_tinh
   */
  @Post('master-data')
  async syncMasterData(
    @Query('table') tableName: string,
    @Body() data: any[],
  ) {
    if (!tableName) return { message: 'Missing table name (query param: table)' };
    return this.syncService.syncMasterData(tableName, data);
  }
}