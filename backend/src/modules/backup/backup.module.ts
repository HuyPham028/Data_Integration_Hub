import { Module } from '@nestjs/common';
import { BackupService } from './backup.service';
import { BackupController } from './backup.controller';
import { MinioService } from './minio.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SchemaRegistryModule } from 'src/common/schema-registry/schema-registry.module';
@Module({
  imports: [PrismaModule, SchemaRegistryModule],
  providers: [BackupService, MinioService],
  controllers: [BackupController],
  exports: [BackupService],
})
export class BackupModule {}
