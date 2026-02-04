import { Module } from '@nestjs/common';
import { LyLichService } from './ly-lich.service';
import { LyLichController } from './ly-lich.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LyLichController],
  providers: [LyLichService],
  exports: [LyLichService],
})
export class LyLichModule {}
