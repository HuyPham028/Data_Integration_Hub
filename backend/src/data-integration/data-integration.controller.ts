import { Body, Controller, Post, Sse, UseGuards } from '@nestjs/common';
import { DataIntegrationService } from './data-integration.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { fromEvent, map, Observable } from 'rxjs';
import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../modules/auth/guards/roles.guard';
import { Roles } from '../modules/auth/decorators/roles.decorator';

@Controller('integration')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class DataIntegrationController {
  constructor(
    private readonly integrationService: DataIntegrationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Post('run-full-sync')
  async triggerFullSync() {
    this.integrationService.runFullIntegrationPipeline();
    return {
      message: 'Integration pipeline started. Please check EventLogs (MongoDB) or Dashboard for progress.',
      timestamp: new Date(),
    };
  }

  @Post('run-custom-sync')
  async triggerCustomSync(@Body('tables') tables: string[]) {
    this.integrationService.runCustomIntegrationPipeline(tables);
    return {
      message: 'Integration custom pipeline started. Please check EventLogs (MongoDB) or Dashboard for progress.',
      timestamp: new Date(),
    };
  }

  @Sse('stream-logs')
  streamLogs(): Observable<MessageEvent> {
    return fromEvent(this.eventEmitter, 'sync.log').pipe(
      map((payload) => ({ data: payload } as MessageEvent)),
    );
  }
}