import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { SchemaRegistryController } from './schema-registry.controller';
import { SchemaRegistryService } from './schema-registry.service';
import { EventLogService } from '../event-log/event-log.service';
import { SchemaRegistry, SchemaRegistrySchema } from './schemas/schema-registry.schema';
import { EventLog, EventLogSchema } from '../event-log/schemas/event-log.schema';
import { GitHubDeployService } from '../github-deploy/github-deploy.service';
import { PrismaSchemaGeneratorService } from '../prisma-schema-generator/prisma-schema-generator.service';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: SchemaRegistry.name, schema: SchemaRegistrySchema },
      { name: EventLog.name, schema: EventLogSchema },
    ]),
  ],
  controllers: [SchemaRegistryController],
  providers: [
    SchemaRegistryService,
    EventLogService,
    GitHubDeployService,
    PrismaSchemaGeneratorService,
  ],
  exports: [SchemaRegistryService],
})
export class SchemaRegistryModule {}
