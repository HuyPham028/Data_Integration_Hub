import { Module } from '@nestjs/common';
import { ApiLogController } from './api-log.controller';
import { ApiLogService } from './api-log.service';
import { ApiLogInterceptor } from './api-log.interceptor';

@Module({
  controllers: [ApiLogController],
  providers: [ApiLogService, ApiLogInterceptor],
  exports: [ApiLogInterceptor],
})
export class ApiLogModule {}
