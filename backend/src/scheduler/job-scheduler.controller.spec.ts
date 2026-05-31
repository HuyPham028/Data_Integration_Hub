import { Test, TestingModule } from '@nestjs/testing';
import { JobSchedulerController } from './job-scheduler.controller';
import { JobSchedulerService } from './job-scheduler.service';

describe('JobSchedulerController', () => {
  let controller: JobSchedulerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobSchedulerController],
      providers: [
        {
          provide: JobSchedulerService,
          useValue: {
            getAllJobs: jest.fn(),
            createJob: jest.fn(),
            updateJob: jest.fn(),
            deleteJob: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<JobSchedulerController>(JobSchedulerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
