import { Module } from '@nestjs/common';
import { ApiLogController } from './api-log.controller';
import { ApiLogService } from './api-log.service';
import { ApiLogInterceptor } from './api-log.interceptor';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ApiLogController],
  providers: [ApiLogService, ApiLogInterceptor],
  exports: [ApiLogInterceptor],
})
export class ApiLogModule {}
