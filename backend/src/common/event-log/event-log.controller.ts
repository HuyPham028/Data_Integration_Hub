import { Controller, Get, Query } from '@nestjs/common';
import { EventLogService } from './event-log.service';

@Controller('event-logs')
export class EventLogController {
  constructor(private readonly logService: EventLogService) {}

  @Get()
  async getLogs(@Query('limit') limit: number = 50) {
    return this.logService.getRecentLogs(limit);
  }
}