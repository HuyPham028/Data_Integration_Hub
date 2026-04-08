import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CronJob, CronTime } from 'cron';
import { SyncJob } from './sync-job.schema';
import { DataIntegrationService } from 'src/data-integration/data-integration.service';

type SyncJobDto = {
  _id: unknown;
  jobName: string;
  jobType: string;
  cronExpression: string;
  isActive: boolean;
  lastRunAt?: Date;
  description?: string;
};

type SyncJobWithNextRun = SyncJobDto & { nextRunAt: Date | null };

@Injectable()
export class JobSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(JobSchedulerService.name);

  constructor(
    @InjectModel(SyncJob.name) private jobModel: Model<SyncJob>,
    private schedulerRegistry: SchedulerRegistry,
    private dataIntegrationService: DataIntegrationService,
  ) {}

  // App starts, load all active job from mongo
  async onModuleInit() {
    this.logger.log('Loading Cron Jobs from database...');
    await this.ensureDefaultJob();
    const jobs = await this.jobModel.find({ isActive: true });
    
    for (const job of jobs) {
      this.registerCronJob(job);
    }
  }

  // Initialize/update 1 cronjob
  private registerCronJob(job: any) {
    // if exist, delete (to update new time)
    try {
      if (this.schedulerRegistry.doesExist('cron', job.jobName)) {
        this.schedulerRegistry.deleteCronJob(job.jobName);
      }
    } catch (e) {}

    // job inactive, not register
    if (!job.isActive) return;

    // new cronjob 
    const cronTask = new CronJob(job.cronExpression, async () => {
      this.logger.log(`[CRON TRIGGERED] Executing job: ${job.jobName}`);
      await this.executeJobLogic(job);
    });

    this.schedulerRegistry.addCronJob(job.jobName, cronTask);
    cronTask.start();
    this.logger.log(`Scheduled Job [${job.jobName}] at (${job.cronExpression})`);
  }

  private getNextRunAt(cronExpression: string): Date | null {
    try {
      const cronTime = new CronTime(cronExpression);
      const next = cronTime.sendAt();

      if (next instanceof Date) {
        return next;
      }

      if (next && typeof (next as { toJSDate?: () => Date }).toJSDate === 'function') {
        return (next as { toJSDate: () => Date }).toJSDate();
      }

      const parsed = new Date(String(next));
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    } catch {
      return null;
    }
  }

  private async ensureDefaultJob() {
    const count = await this.jobModel.estimatedDocumentCount();
    if (count > 0) {
      return;
    }

    await this.jobModel.create({
      jobName: 'nightly-full-sync',
      jobType: 'FULL_SYNC',
      cronExpression: '0 2 * * *',
      isActive: true,
      description: 'Default nightly full synchronization job',
    });

    this.logger.log('No sync jobs found. Seeded default job: nightly-full-sync');
  }

  private async executeJobLogic(job: any) {
    if (job.jobType === 'FULL_SYNC') {
      await this.dataIntegrationService.runFullIntegrationPipeline();
    }
    
    await this.jobModel.findByIdAndUpdate(job._id, { lastRunAt: new Date() });
  }

  // --- API function for frontend ---  

  async getAllJobs(): Promise<SyncJobWithNextRun[]> {
    const jobs = await this.jobModel.find().lean<SyncJobDto[]>().exec();
    return jobs.map((job) => ({
      ...job,
      nextRunAt: job.isActive ? this.getNextRunAt(job.cronExpression) : null,
    }));
  }

  async createJob(data: Partial<SyncJob>) {
    const newJob = await this.jobModel.create(data);
    this.registerCronJob(newJob);
    return newJob;
  }

  async updateJob(id: string, updateData: Partial<SyncJob>) {
    const updatedJob = await this.jobModel.findByIdAndUpdate(id, updateData, { new: true });
    // Refresh lại lịch chạy trong bộ nhớ
    this.registerCronJob(updatedJob); 
    return updatedJob;
  }

  async toggleJobActive(id: string, isActive: boolean) {
    const job = await this.jobModel.findByIdAndUpdate(id, { isActive }, { new: true });
    if (!job) {
      throw new Error('Job not found');
    }
    if (isActive) {
      this.registerCronJob(job);
    } else {
      // Tắt job -> Xóa khỏi bộ nhớ
      try {
        this.schedulerRegistry.deleteCronJob(job.jobName);
        this.logger.warn(`Paused Job [${job.jobName}]`);
      } catch (e) {}
    }
    return job;
  }

  async triggerJobManually(id: string) {
    const job = await this.jobModel.findById(id);
    if (!job) throw new Error('Job not found');
    
    this.logger.log(`[MANUAL TRIGGER] Executing job: ${job.jobName}`);
    // Không đợi hàm chạy xong (chạy ngầm) để trả response HTTP về ngay
    this.executeJobLogic(job).catch(err => this.logger.error(err)); 
    
    return { message: 'Job started manually', jobName: job.jobName };
  }
}