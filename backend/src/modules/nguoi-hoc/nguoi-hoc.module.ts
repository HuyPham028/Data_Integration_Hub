import { Module } from '@nestjs/common';
import { NguoiHocService } from './nguoi-hoc.service';
import { NguoiHocController } from './nguoi-hoc.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [PrismaModule, HttpModule],
  providers: [NguoiHocService],
  controllers: [NguoiHocController],
  exports: [NguoiHocService]
})
export class NguoiHocModule {}
