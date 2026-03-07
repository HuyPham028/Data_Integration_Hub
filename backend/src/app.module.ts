import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
// import { AuthModule } from './modules/auth/auth.module';
// import { UsersModule } from './modules/users/users.module';
// import { RolesModule } from './modules/roles/roles.module';
// import { PermissionsModule } from './modules/permissions/permissions.module';
import { SyncModule } from './sync/sync.module';
import { MasterDataModule } from './master-data/master-data.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    // UsersModule,
    // AuthModule,
    // RolesModule,
    // PermissionsModule,
    SyncModule,
    MasterDataModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
