import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';

import { MasterDataService } from './master-data.service';
import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../modules/auth/guards/permissions.guard';

/**
 * Tất cả routes đều yêu cầu JWT + kiểm tra quyền theo bảng:
 *   GET             → role reader hoặc writer có tablePattern khớp :table
 *   POST/PATCH/DELETE → role writer có tablePattern khớp :table
 *   admin           → bypass mọi kiểm tra
 */
@Controller('api/master-data')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MasterDataController {
  constructor(private readonly masterDataService: MasterDataService) {}

  // GET /api/master-data/dm_gioi_tinh?page=1&limit=20&search=Nam
  @Get(':table')
  findAll(
    @Param('table') table: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
  ) {
    return this.masterDataService.findAll(table, page, limit, search);
  }

  // GET /api/master-data/dm_gioi_tinh/1
  @Get(':table/:id')
  findOne(@Param('table') table: string, @Param('id') id: string) {
    return this.masterDataService.findOne(table, +id);
  }

  // POST /api/master-data/dm_gioi_tinh
  @Post(':table')
  create(@Param('table') table: string, @Body() body: any) {
    return this.masterDataService.create(table, body);
  }

  // PATCH /api/master-data/dm_gioi_tinh/1
  @Patch(':table/:id')
  update(
    @Param('table') table: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.masterDataService.update(table, +id, body);
  }

  // DELETE /api/master-data/dm_gioi_tinh/1
  @Delete(':table/:id')
  remove(@Param('table') table: string, @Param('id') id: string) {
    return this.masterDataService.remove(table, +id);
  }
}
