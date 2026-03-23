import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { SyncModule } from './sync/sync.module';
import { MasterDataModule } from './master-data/master-data.module';
import { NguoiHocModule } from './modules/nguoi-hoc/nguoi-hoc.module';
import { MongooseModule } from '@nestjs/mongoose';
import { EventLogModule } from './common/event-log/event-log.module';
import { SchemaRegistryModule } from './common/schema-registry/schema-registry.module';
import { SyncEngineModule } from './modules/sync-engine/sync-engine.module';
import { DataIntegrationModule } from './data-integration/data-integration.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true, 
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'), 
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    RolesModule,
    PermissionsModule,
    SyncModule,
    MasterDataModule,
    NguoiHocModule,
    EventLogModule,
    SchemaRegistryModule,
    SyncEngineModule,
    DataIntegrationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
