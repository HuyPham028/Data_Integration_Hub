import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { EventLogService } from './event-log.service';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../modules/auth/guards/roles.guard';
import { Roles } from '../../modules/auth/decorators/roles.decorator';

@Controller('event-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class EventLogController {
  constructor(private readonly logService: EventLogService) {}

  @Get()
  async getLogs(@Query('limit') limit: number = 50) {
    return this.logService.getRecentLogs(limit);
  }
}