import { Body, Controller, Post, Sse } from '@nestjs/common';
import { DataIntegrationService } from './data-integration.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { fromEvent, map, Observable } from 'rxjs';

@Controller('integration')
export class DataIntegrationController {
  constructor(
    private readonly integrationService: DataIntegrationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // POST /api/v1/integration/run-full-sync
  @Post('run-full-sync')
  async triggerFullSync() {
    // Trả về response ngay lập tức để không bị Timeout HTTP, 
    // trong khi tiến trình sync vẫn chạy ngầm (Asynchronous)
    this.integrationService.runFullIntegrationPipeline();
    
    return {
      message: 'Integration pipeline started. Please check EventLogs (MongoDB) or Dashboard for progress.',
      timestamp: new Date()
    };
  }

  @Post('run-custom-sync')
  async triggerCustomSyn(@Body('tables') tables: string[]) {
    this.integrationService.runCustomIntegrationPipeline(tables)

    return {
      message: 'Integration custom pipeline started. Please check EventLogs (MongoDB) or Dashboard for progress.',
      timestamp: new Date()
    }
  }

  @Sse('stream-logs')
  streamLogs(): Observable<MessageEvent> {
    return fromEvent(this.eventEmitter, 'sync.log').pipe(
      map((payload) => ({
        data: payload,
      } as MessageEvent))
    )
  }
}