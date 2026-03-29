import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SyncJob, SyncJobSchema } from './sync-job.schema';
import { JobSchedulerController } from './job-scheduler.controller';
import { JobSchedulerService } from './job-scheduler.service';
import { DataIntegrationModule } from 'src/data-integration/data-integration.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: SyncJob.name, schema: SyncJobSchema}]),
    DataIntegrationModule,
  ],
  controllers: [JobSchedulerController],
  providers: [JobSchedulerService],
  exports: [JobSchedulerService]
})
export class JobSchedulerModule {}
