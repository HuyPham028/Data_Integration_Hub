import { Test, TestingModule } from '@nestjs/testing';
import { JobSchedulerController } from './job-scheduler.controller';

describe('JobSchedulerController', () => {
  let controller: JobSchedulerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobSchedulerController],
    }).compile();

    controller = module.get<JobSchedulerController>(JobSchedulerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
