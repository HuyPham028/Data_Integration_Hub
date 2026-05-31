import { Test, TestingModule } from '@nestjs/testing';
import { JobSchedulerService } from './job-scheduler.service';
import { getModelToken } from '@nestjs/mongoose';
import { SchedulerRegistry } from '@nestjs/schedule';
import { SyncJob } from './sync-job.schema';
import { DataIntegrationService } from 'src/data-integration/data-integration.service';
import { NotificationService } from 'src/common/notification/notification.service';

describe('JobSchedulerService', () => {
  let service: JobSchedulerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobSchedulerService,
        {
          provide: getModelToken(SyncJob.name),
          useValue: {
            find: jest.fn().mockResolvedValue([]),
            findById: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: SchedulerRegistry,
          useValue: {
            addCronJob: jest.fn(),
            deleteCronJob: jest.fn(),
            getCronJob: jest.fn(),
            getCronJobs: jest.fn().mockReturnValue(new Map()),
          },
        },
        {
          provide: DataIntegrationService,
          useValue: { runCustomIntegrationPipeline: jest.fn() },
        },
        {
          provide: NotificationService,
          useValue: {
            sendJobSuccessSummary: jest.fn(),
            sendJobFailureAlert: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<JobSchedulerService>(JobSchedulerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
