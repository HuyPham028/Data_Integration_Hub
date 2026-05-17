import { Injectable, Logger, OnModuleInit, BadRequestException } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CronJob, CronTime } from 'cron';
import { SyncJob } from './sync-job.schema';
import { DataIntegrationService } from 'src/data-integration/data-integration.service';
import { NotificationService } from 'src/common/notification/notification.service';

type SyncJobDto = {
  _id: unknown;
  jobName: string;
  jobType: 'FULL_SYNC' | 'CUSTOM_SYNC';
  targetTables?: string[];
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
    private notificationService: NotificationService,
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
    try {
      const cronExpr = this.normalizeCronExpression(job);
      const cronTask = new CronJob(cronExpr, async () => {
        this.logger.log(`[CRON TRIGGERED] Executing job: ${job.jobName}`);
        await this.executeJobLogic(job);
      });

      this.schedulerRegistry.addCronJob(job.jobName, cronTask);
      cronTask.start();
      this.logger.log(`Scheduled Job [${job.jobName}] at (${job.cronExpression})`);
    } catch (error) {
      this.logger.error(`Failed to register cron job [${job.jobName}]: Invalid cron expression (${job.cronExpression})`);
    }
  }

  // Normalize legacy cron expressions that have only 4 fields (missing day-of-week or similar).
  // If normalization succeeds we persist the corrected expression back to the DB asynchronously.
  private normalizeCronExpression(job: any): string {
    const expr = (job?.cronExpression || '').trim();
    const parts = expr.split(/\s+/);

    if (parts.length === 4) {
      const fixed = `${expr} *`;
      try {
        new CronTime(fixed);
        // Persist the fix but don't block scheduling on DB write.
        this.jobModel.findByIdAndUpdate(job._id, { cronExpression: fixed }).catch((err) =>
          this.logger.warn(`Failed to persist normalized cron for [${job.jobName}]: ${err}`),
        );
        this.logger.warn(`Normalized cron expression for [${job.jobName}] from '${expr}' to '${fixed}'`);
        return fixed;
      } catch (e) {
        this.logger.warn(`Normalization produced invalid cron for [${job.jobName}]: '${fixed}'`);
        return expr;
      }
    }

    return expr;
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
    const result = await this.jobModel.updateOne(
      { jobName: 'nightly-full-sync' },
      {
        $setOnInsert: {
          jobName: 'nightly-full-sync',
          jobType: 'FULL_SYNC',
          cronExpression: '0 2 * * *',
          isActive: true,
          description: 'Default nightly full synchronization job',
        },
      },
      { upsert: true },
    );

    if (result.upsertedCount > 0) {
      this.logger.log('No sync jobs found. Seeded default job: nightly-full-sync');
    }
  }

  private async executeJobLogic(job: any) {
    const startedAt = Date.now();
    try {
      if (job.jobType === 'FULL_SYNC') {
        await this.dataIntegrationService.runFullIntegrationPipeline(job.jobName);
      } else if (job.jobType === 'CUSTOM_SYNC' && job.targetTables && job.targetTables.length > 0) {
        await this.dataIntegrationService.runCustomIntegrationPipeline(job.jobName, job.targetTables);
      } else {
        this.logger.warn(`Job [${job.jobName}] is CUSTOM_SYNC but has no targetTables. Skipped.`);
      }

      const durationMs = Date.now() - startedAt;
      await this.jobModel.findByIdAndUpdate(job._id, { lastRunAt: new Date() });
      this.logger.log(`[CRON DONE] Job "${job.jobName}" hoàn thành sau ${(durationMs / 1000).toFixed(1)}s`);

      await this.notificationService.sendJobSuccessSummary(
        job.jobName,
        `Job "${job.jobName}" đã chạy thành công.`,
        durationMs,
      );
    } catch (err) {
      const durationMs = Date.now() - startedAt;
      this.logger.error(`[CRON ERROR] Job "${job.jobName}" thất bại: ${err.message}`);
      await this.notificationService.sendJobFailureAlert(job.jobName, err, durationMs);
    }
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
    if (data.cronExpression) {
      try {
        new CronTime(data.cronExpression);
      } catch (e) {
        throw new BadRequestException('Invalid cron expression');
      }
    }

    try {
      const newJob = await this.jobModel.create(data);
      this.registerCronJob(newJob);
      return newJob;
    } catch (error) {
      const mongoError = error as { code?: number };

      if (mongoError.code === 11000 && data?.jobName) {
        const existingJob = await this.jobModel.findOne({ jobName: data.jobName });

        if (existingJob) {
          this.logger.warn(
            `Job with name [${data.jobName}] already exists. Returning existing job instead of creating duplicate.`,
          );
          this.registerCronJob(existingJob);
          return existingJob;
        }
      }

      throw error;
    }
  }

  async updateJob(id: string, updateData: Partial<SyncJob>) {
    if (updateData.cronExpression) {
      try {
        new CronTime(updateData.cronExpression);
      } catch (e) {
        throw new BadRequestException('Invalid cron expression');
      }
    }

    const updatedJob = await this.jobModel.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedJob) throw new Error(`Job ${id} not found`);
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
    this.executeJobLogic(job).catch(err => this.logger.error(err));
    
    return { message: 'Job started manually', jobName: job.jobName };
  }
}