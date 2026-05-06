import { Module } from '@nestjs/common';
import { MasterDataService } from './master-data.service';
import { MasterDataController } from './master-data.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SchemaRegistryModule } from 'src/common/schema-registry/schema-registry.module';
import { TablesController } from './tables.controller';

@Module({
  imports: [PrismaModule, SchemaRegistryModule],
  providers: [MasterDataService],
  controllers: [MasterDataController, TablesController]
})
export class MasterDataModule {}
