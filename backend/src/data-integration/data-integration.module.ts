import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DataIntegrationController } from './data-integration.controller';
import { DataIntegrationService } from './data-integration.service';
import { SchemaRegistryModule } from 'src/common/schema-registry/schema-registry.module';
import { SyncEngineModule } from 'src/modules/sync-engine/sync-engine.module';

@Module({
  imports: [
    HttpModule,
    SchemaRegistryModule,
    SyncEngineModule 
  ],
  controllers: [DataIntegrationController],
  providers: [DataIntegrationService],
})
export class DataIntegrationModule {}