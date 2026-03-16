import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventLog, EventLogSchema } from './schemas/event-log.schema';
import { EventLogService } from './event-log.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EventLog.name, schema: EventLogSchema},
    ]),
  ],
  providers: [EventLogService],
  controllers: [],
  exports: [EventLogService]
})
export class EventLogModule {}