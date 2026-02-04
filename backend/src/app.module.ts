import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ApiSchemasModule } from './api-schemas/api-schemas.module';
import { PrismaModule } from './prisma/prisma.module';
import { MasterDataModule } from './master-data/master-data.module';
import { LyLichModule } from './ly-lich/ly-lich.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    ApiSchemasModule,
    MasterDataModule,
    LyLichModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
export class AppModule {}
