import { Module } from '@nestjs/common';
import { MasterDataService } from './master-data.service';
import { MasterDataController } from './master-data.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SchemaRegistryModule } from 'src/common/schema-registry/schema-registry.module';

@Module({
  imports: [PrismaModule, SchemaRegistryModule],
  providers: [MasterDataService],
  controllers: [MasterDataController]
})
export class MasterDataModule {}
