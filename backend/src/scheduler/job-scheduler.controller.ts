import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { JobSchedulerService } from './job-scheduler.service';

@Controller('jobs')
export class JobSchedulerController {
  constructor(private readonly schedulerService: JobSchedulerService) {}

  @Get()
  getAllJobs() { return this.schedulerService.getAllJobs(); }

  @Post()
  createJob(@Body() body: any) { return this.schedulerService.createJob(body); }

  @Put(':id/toggle')
  toggleJob(@Param('id') id: string, @Body('isActive') isActive: boolean) {
    return this.schedulerService.toggleJobActive(id, isActive);
  }

  @Put(':id')
  updateJob(@Param('id') id: string, @Body() body: any) {
    return this.schedulerService.updateJob(id, body);
  }

  @Post(':id/trigger')
  triggerJob(@Param('id') id: string) {
    return this.schedulerService.triggerJobManually(id);
  }
}