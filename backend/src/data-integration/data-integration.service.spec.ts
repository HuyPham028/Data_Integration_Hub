import { Test, TestingModule } from '@nestjs/testing';
import { DataIntegrationService } from './data-integration.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SchemaRegistryService } from 'src/common/schema-registry/schema-registry.service';
import { SyncEngineService } from 'src/modules/sync-engine/sync-engine.service';
import { BackupService } from 'src/modules/backup/backup.service';
import { EventLogService } from 'src/common/event-log/event-log.service';
import { NotificationService } from 'src/common/notification/notification.service';

const mockSchemaRegistry = {
  getAllSchema: jest.fn(),
  updateLastSyncTime: jest.fn().mockResolvedValue(undefined),
};
const mockSyncEngine = {
  syncTableData: jest.fn(),
  overwriteTableData: jest.fn(),
  detectOrphans: jest.fn().mockResolvedValue([]),
  deleteRecordsByIds: jest.fn(),
};
const mockHttpService = { request: jest.fn() };
const mockEventEmitter = { emit: jest.fn() };
const mockConfigService = { get: jest.fn().mockReturnValue('') };
const mockEventLog = {
  createJobLog: jest.fn().mockResolvedValue({ id: 'log-id', _id: 'log-id' }),
  finishJobLog: jest.fn().mockResolvedValue(undefined),
};
const mockBackupService = { backupTable: jest.fn().mockResolvedValue(undefined) };
const mockNotification = {
  sendJobSuccessSummary: jest.fn().mockResolvedValue(undefined),
  sendJobFailureAlert: jest.fn().mockResolvedValue(undefined),
};

describe('DataIntegrationService', () => {
  let service: DataIntegrationService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataIntegrationService,
        { provide: SchemaRegistryService, useValue: mockSchemaRegistry },
        { provide: SyncEngineService, useValue: mockSyncEngine },
        { provide: HttpService, useValue: mockHttpService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EventLogService, useValue: mockEventLog },
        { provide: BackupService, useValue: mockBackupService },
        { provide: NotificationService, useValue: mockNotification },
      ],
    }).compile();

    service = module.get<DataIntegrationService>(DataIntegrationService);
  });

  // ─── filterByUpdatedAt ────────────────────────────────────────────────────

  describe('filterByUpdatedAt', () => {
    const filter = (records: any[], date: Date | null) =>
      (service as any).filterByUpdatedAt(records, date);

    it('returns all records unchanged when lastSyncTime is null (first sync)', () => {
      const records = [{ id: 1, updatedAt: '2020-01-01' }, { id: 2 }];
      expect(filter(records, null)).toEqual(records);
    });

    it('keeps only records updated strictly after lastSyncTime', () => {
      const cutoff = new Date('2024-01-15T00:00:00Z');
      const records = [
        { id: 1, updatedAt: '2024-01-10T00:00:00Z' }, // before → drop
        { id: 2, updatedAt: '2024-01-20T00:00:00Z' }, // after  → keep
        { id: 3, updatedAt: '2024-01-15T00:00:00Z' }, // equal  → drop
      ];
      const result = filter(records, cutoff);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
    });

    it('keeps records with no updatedAt field (undefined or null)', () => {
      const cutoff = new Date('2024-01-15T00:00:00Z');
      const records = [
        { id: 1 },               // updatedAt undefined → keep (safe default)
        { id: 2, updatedAt: null }, // updatedAt null → keep (safe default)
      ];
      expect(filter(records, cutoff)).toHaveLength(2);
    });

    it('drops records with an invalid (unparseable) updatedAt string', () => {
      const cutoff = new Date('2024-01-15T00:00:00Z');
      const records = [{ id: 1, updatedAt: 'not-a-date' }];
      expect(filter(records, cutoff)).toHaveLength(0);
    });

    it('returns empty array when all records are older than lastSyncTime', () => {
      const cutoff = new Date('2025-01-01T00:00:00Z');
      const records = [
        { id: 1, updatedAt: '2024-01-01T00:00:00Z' },
        { id: 2, updatedAt: '2024-06-01T00:00:00Z' },
      ];
      expect(filter(records, cutoff)).toHaveLength(0);
    });
  });

  // ─── withRetry ────────────────────────────────────────────────────────────

  describe('withRetry', () => {
    beforeEach(() => {
      // Disable actual sleep so tests run instantly
      (service as any).RETRY_DELAY_MS = 0;
    });

    it('returns the value immediately on first success without retrying', async () => {
      const op = jest.fn().mockResolvedValue('ok');
      const result = await (service as any).withRetry(op, 'ctx');
      expect(result).toBe('ok');
      expect(op).toHaveBeenCalledTimes(1);
    });

    it('retries after a failure and returns value on the 2nd attempt', async () => {
      const op = jest
        .fn()
        .mockRejectedValueOnce(new Error('network blip'))
        .mockResolvedValue('recovered');
      const result = await (service as any).withRetry(op, 'ctx');
      expect(result).toBe('recovered');
      expect(op).toHaveBeenCalledTimes(2);
    });

    it('throws a MAX RETRIES EXCEEDED error after all 3 attempts fail', async () => {
      const op = jest.fn().mockRejectedValue(new Error('persistent failure'));
      await expect((service as any).withRetry(op, 'ctx')).rejects.toThrow(
        'MAX RETRIES EXCEEDED',
      );
      expect(op).toHaveBeenCalledTimes(3);
    });

    it('includes the last error message in the thrown error', async () => {
      const op = jest.fn().mockRejectedValue(new Error('timeout'));
      await expect((service as any).withRetry(op, 'ctx')).rejects.toThrow(
        'timeout',
      );
    });
  });

  // ─── purgeOrphans ─────────────────────────────────────────────────────────

  describe('purgeOrphans', () => {
    it('returns {deleted: 0} immediately when ids array is empty', async () => {
      const result = await service.purgeOrphans('some_table', 'id', []);
      expect(result).toEqual({ deleted: 0 });
      expect(mockEventLog.createJobLog).not.toHaveBeenCalled();
    });

    it('returns {deleted: 0} when ids is null/undefined-like (empty)', async () => {
      const result = await service.purgeOrphans('some_table', 'id', null as any);
      expect(result).toEqual({ deleted: 0 });
    });

    it('calls syncEngine.deleteRecordsByIds with the correct arguments', async () => {
      mockSyncEngine.deleteRecordsByIds.mockResolvedValue(2);

      const result = await service.purgeOrphans('user_table', 'userId', [101, 102]);

      expect(mockSyncEngine.deleteRecordsByIds).toHaveBeenCalledWith(
        'user_table',
        'userId',
        [101, 102],
      );
      expect(result).toEqual({ deleted: 2 });
    });

    it('logs a job entry and finishes it after purge', async () => {
      mockSyncEngine.deleteRecordsByIds.mockResolvedValue(1);

      await service.purgeOrphans('order_table', 'orderId', [999]);

      expect(mockEventLog.createJobLog).toHaveBeenCalledTimes(1);
      expect(mockEventLog.finishJobLog).toHaveBeenCalledTimes(1);
    });
  });

  // ─── runCustomIntegrationPipeline ─────────────────────────────────────────

  describe('runCustomIntegrationPipeline', () => {
    it('returns early with a message when tableNames is empty', async () => {
      const result = await service.runCustomIntegrationPipeline([]);
      expect(result).toEqual({ message: 'No table names provided' });
      expect(mockSchemaRegistry.getAllSchema).not.toHaveBeenCalled();
    });

    it('trims and deduplicates table names before querying schemas', async () => {
      mockSchemaRegistry.getAllSchema.mockResolvedValue([]);

      await service.runCustomIntegrationPipeline(['  users  ', 'users', 'orders']);

      // getAllSchema is called once (dedup ran first, early-exit due to no schemas)
      expect(mockSchemaRegistry.getAllSchema).toHaveBeenCalledTimes(1);
    });

    it('returns missingTables when none of the requested tables match stable schemas', async () => {
      mockSchemaRegistry.getAllSchema.mockResolvedValue([
        { tableName: 'other_table', status: 'stable' },
      ]);

      const result = (await service.runCustomIntegrationPipeline([
        'nonexistent',
      ])) as any;
      expect(result.missingTables).toContain('nonexistent');
    });

    it('skips tables whose schemas are not stable', async () => {
      mockSchemaRegistry.getAllSchema.mockResolvedValue([
        { tableName: 'users', status: 'draft' }, // not stable
      ]);

      const result = (await service.runCustomIntegrationPipeline(['users'])) as any;
      expect(result.missingTables).toContain('users');
    });
  });
});
