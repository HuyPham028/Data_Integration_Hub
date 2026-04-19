import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventLog } from './schemas/event-log.schema';

@Injectable()
export class EventLogService {
  constructor(@InjectModel(EventLog.name) private logModel: Model<EventLog>) {}

  async createJobLog(title: string, tag: string, type: string = 'sync') {
    const newLog = new this.logModel({
      title,
      tag,
      type,
      status: 'running',
      details: { startTime: new Date(), metrics: {}, errors: [] },
    });
    return await newLog.save();
  }

  async finishJobLog(logId: string, status: string, metrics: any, errors: any[] = []) {
    const log = await this.logModel.findById(logId);
    if (!log) return;

    log.status = status;
    log.details.endTime = new Date();
    log.details.durationMs = log.details.endTime.getTime() - log.details.startTime.getTime();
    log.details.metrics = metrics;
    log.details.errors = errors;

    // Phải markModified vì Mongoose đôi khi không track được thay đổi sâu trong Object
    log.markModified('details'); 
    await log.save();
  }

  async getRecentLogs(limit: number = 50, type?: string) {
    const filter = type ? { type } : {};

    return await this.logModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }
}