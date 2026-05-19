import { Controller, Sse, MessageEvent } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

@Controller('notifications')
export class NotificationController {
  private notificationSubject = new Subject<any>();

  constructor(private readonly eventEmitter: EventEmitter2) {}

  // 1. Listen to the schema.changed event emitted from SchemaRegistryService
  @OnEvent('schema.changed')
  handleSchemaChange(payload: { tableName: string }) {
    this.notificationSubject.next({
      id: Date.now().toString(),
      type: 'warning',
      title: 'Schema Drift Detected',
      message: `Changes detected in table: ${payload.tableName}. Please review.`,
      timestamp: new Date().toISOString(),
    });
  }

  // 2. listen to sync.log or Job success/failures from DataIntegrationService
  @OnEvent('sync.job.completed')
  handleSyncCompleted(payload: { jobName: string; message: string }) {
    this.notificationSubject.next({
      id: Date.now().toString(),
      type: 'success',
      title: 'Sync Completed',
      message: payload.message,
      timestamp: new Date().toISOString(),
    });
  }

  // 3. Expose the SSE endpoint
  @Sse('stream')
  streamNotifications(): Observable<MessageEvent> {
    return this.notificationSubject.asObservable().pipe(
      map((data) => ({ data: data } as MessageEvent))
    );
  }
}