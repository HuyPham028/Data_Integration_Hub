import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SourceConfig, SourceConfigSchema } from './schemas/source-config.schema';
import { SourceConfigService } from './source-config.service';
import { SourceConfigController } from './source-config.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SourceConfig.name, schema: SourceConfigSchema },
    ]),
  ],
  controllers: [SourceConfigController],
  providers: [SourceConfigService],
  exports: [SourceConfigService],
})
export class SourceConfigModule {}
