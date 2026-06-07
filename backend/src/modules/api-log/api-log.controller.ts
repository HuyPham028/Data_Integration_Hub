import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiLogService } from './api-log.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('api-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class ApiLogController {
  constructor(private readonly service: ApiLogService) {}

  @Get()
  getLogs(
    @Query('table') tableName?: string,
    @Query('user') username?: string,
    @Query('from') fromDate?: string,
    @Query('to') toDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getLogs({
      tableName,
      username,
      fromDate,
      toDate,
      page: page ? parseInt(page) : 1,
      limit: limit ? Math.min(parseInt(limit), 200) : 50,
    });
  }

  @Get('summary')
  getSummary(@Query('days') days?: string) {
    return this.service.getSummary(days ? parseInt(days) : 7);
  }
}
