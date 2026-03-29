import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DataIntegrationController } from './data-integration.controller';
import { DataIntegrationService } from './data-integration.service';
import { SchemaRegistryModule } from 'src/common/schema-registry/schema-registry.module';
import { SyncEngineModule } from 'src/modules/sync-engine/sync-engine.module';
import { EventLogModule } from 'src/common/event-log/event-log.module';

@Module({
  imports: [
    HttpModule,
    SchemaRegistryModule,
    SyncEngineModule,
    EventLogModule,
  ],
  controllers: [DataIntegrationController],
  providers: [DataIntegrationService],
  exports: [DataIntegrationService],
})
export class DataIntegrationModule {}