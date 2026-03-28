import { Module } from '@nestjs/common';
import { SyncEngineService } from './sync-engine.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EventLogModule } from 'src/common/event-log/event-log.module';

@Module({
  imports: [PrismaModule, EventLogModule],
  providers: [SyncEngineService],
  exports: [SyncEngineService]
})
export class SyncEngineModule {}
