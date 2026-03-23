import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventLog, EventLogSchema } from './schemas/event-log.schema';
import { EventLogService } from './event-log.service';
import { EventLogController } from './event-log.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EventLog.name, schema: EventLogSchema},
    ]),
  ],
  providers: [EventLogService],
  controllers: [EventLogController],
  exports: [EventLogService]
})
export class EventLogModule {}