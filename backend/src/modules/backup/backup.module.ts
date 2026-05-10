import { Module } from '@nestjs/common';
import { BackupService } from './backup.service';
import { BackupController } from './backup.controller';
import { MinioService } from './minio.service';
import { S3Service } from './s3.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SchemaRegistryModule } from 'src/common/schema-registry/schema-registry.module';
@Module({
  imports: [PrismaModule, SchemaRegistryModule],
  providers: [BackupService, MinioService, S3Service],
  controllers: [BackupController],
  exports: [BackupService],
})
export class BackupModule {}
