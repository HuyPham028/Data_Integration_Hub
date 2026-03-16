import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SchemaRegistryController } from './schema-registry.controller';
import { SchemaRegistryService } from './schema-registry.service';
import { EventLogService } from '../event-log/event-log.service';
import { SchemaRegistry, SchemaRegistrySchema } from './schemas/schema-registry.schema';
import { EventLog, EventLogSchema } from '../event-log/schemas/event-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SchemaRegistry.name, schema: SchemaRegistrySchema},
      { name: EventLog.name, schema: EventLogSchema},
    ]),
  ],
  controllers: [SchemaRegistryController],
  providers: [SchemaRegistryService, EventLogService],
  exports: [SchemaRegistryService]
})
export class SchemaRegistryModule {}