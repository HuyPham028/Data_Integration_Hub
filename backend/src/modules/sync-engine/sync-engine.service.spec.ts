import { Test, TestingModule } from '@nestjs/testing';
import { SyncEngineService } from './sync-engine.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { EventLogService } from 'src/common/event-log/event-log.service';

const mockEventLog = {
  createJobLog: jest.fn().mockResolvedValue({ _id: 'log-id' }),
  finishJobLog: jest.fn().mockResolvedValue(undefined),
};

describe('SyncEngineService', () => {
  let service: SyncEngineService;
  let mockPrisma: Record<string, any>;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncEngineService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventLogService, useValue: mockEventLog },
      ],
    }).compile();

    service = module.get<SyncEngineService>(SyncEngineService);
  });

  // ─── getPrismaModelName ────────────────────────────────────────────────────

  describe('getPrismaModelName', () => {
    const convert = (name: string) => (service as any).getPrismaModelName(name);

    it('resolves mapped Prisma model names from snake_case table names', () => {
      expect(convert('nguoi_hoc')).toBe('NguoiHoc');
      expect(convert('dm_dt_hinh_thuc_cm')).toBe('DmDtHinhThucCM');
    });

    it('leaves single-word names unchanged', () => {
      expect(convert('students')).toBe('students');
      expect(convert('user')).toBe('user');
    });

    it('falls back to the camel-case heuristic when no mapped model exists', () => {
      // single-letter segments: a_b_c → aBC (each letter capitalised)
      expect(convert('a_b_c')).toBe('aBC');
    });
  });

  // ─── deduplicate ──────────────────────────────────────────────────────────

  describe('deduplicate', () => {
    const dedup = (arr: any[], pk: string) => (service as any).deduplicate(arr, pk);

    it('removes duplicate PKs and keeps the last occurrence', () => {
      const records = [
        { id: 1, name: 'first' },
        { id: 2, name: 'unique' },
        { id: 1, name: 'last' },
      ];
      const result = dedup(records, 'id');
      expect(result).toHaveLength(2);
      expect(result.find((r: any) => r.id === 1).name).toBe('last');
    });

    it('passes through records with no duplicates', () => {
      const records = [{ id: 1 }, { id: 2 }, { id: 3 }];
      expect(dedup(records, 'id')).toHaveLength(3);
    });

    it('keeps null/undefined PK records at the end without deduplication', () => {
      const records = [
        { id: 1, name: 'valid' },
        { name: 'no-pk' },
        { id: null, name: 'null-pk' },
      ];
      const result = dedup(records, 'id');
      expect(result).toHaveLength(3);
      const tail = result.slice(-2).map((r: any) => r.name);
      expect(tail).toContain('no-pk');
      expect(tail).toContain('null-pk');
    });

    it('deduplicates string PKs correctly', () => {
      const records = [
        { code: 'A001', v: 1 },
        { code: 'A001', v: 2 },
        { code: 'A002', v: 3 },
      ];
      const result = dedup(records, 'code');
      expect(result).toHaveLength(2);
      expect(result.find((r: any) => r.code === 'A001').v).toBe(2);
    });
  });

  // ─── detectUnknownFields ──────────────────────────────────────────────────

  describe('detectUnknownFields', () => {
    const detect = (data: any[], valid: Set<string>) =>
      (service as any).detectUnknownFields(data, valid);

    it('returns empty array when all fields are known', () => {
      const valid = new Set(['id', 'name', 'email']);
      expect(detect([{ id: 1, name: 'Alice' }], valid)).toEqual([]);
    });

    it('returns names of fields not in validFields', () => {
      const valid = new Set(['id', 'name']);
      const result = detect([{ id: 1, name: 'Bob', extra: 'x', another: 'y' }], valid);
      expect(result).toContain('extra');
      expect(result).toContain('another');
      expect(result).not.toContain('id');
    });

    it('unions unknown fields across multiple records', () => {
      const valid = new Set(['id']);
      const data = [{ id: 1, fieldA: 'a' }, { id: 2, fieldB: 'b' }];
      const result = detect(data, valid);
      expect(result).toContain('fieldA');
      expect(result).toContain('fieldB');
    });

    it('returns empty array for empty data array', () => {
      const valid = new Set(['id']);
      expect(detect([], valid)).toEqual([]);
    });
  });

  // ─── detectOrphans ────────────────────────────────────────────────────────

  describe('detectOrphans', () => {
    it('returns IDs present in destination but absent from sourceIds', async () => {
      mockPrisma.user = {
        findMany: jest.fn().mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]),
      };
      const sourceIds = new Set<unknown>([1, 2]);
      const result = await service.detectOrphans('user', 'id', sourceIds);
      expect(result).toEqual([3]);
    });

    it('returns empty array when all destination IDs are in source', async () => {
      mockPrisma.student = {
        findMany: jest.fn().mockResolvedValue([{ sid: 'A001' }, { sid: 'A002' }]),
      };
      const sourceIds = new Set<unknown>(['A001', 'A002', 'A003']);
      const result = await service.detectOrphans('student', 'sid', sourceIds);
      expect(result).toEqual([]);
    });

    it('returns empty array when model does not exist in Prisma', async () => {
      // mockPrisma has no 'unknownTable' key
      const result = await service.detectOrphans('unknown_table', 'id', new Set([1]));
      expect(result).toEqual([]);
    });

    it('detects multiple orphans', async () => {
      mockPrisma.course = {
        findMany: jest.fn().mockResolvedValue([
          { courseId: 'C1' },
          { courseId: 'C2' },
          { courseId: 'C3' },
          { courseId: 'C4' },
        ]),
      };
      const sourceIds = new Set<unknown>(['C2']);
      const result = await service.detectOrphans('course', 'courseId', sourceIds);
      expect(result).toHaveLength(3);
      expect(result).toContain('C1');
      expect(result).toContain('C3');
      expect(result).toContain('C4');
    });
  });

  // ─── deleteRecordsByIds ───────────────────────────────────────────────────

  describe('deleteRecordsByIds', () => {
    it('throws when model does not exist in Prisma', async () => {
      await expect(
        service.deleteRecordsByIds('ghost_table', 'id', [1, 2]),
      ).rejects.toThrow('does not exist in Prisma');
    });

    it('calls deleteMany with the correct where clause', async () => {
      mockPrisma.order = {
        deleteMany: jest.fn().mockResolvedValue({ count: 3 }),
      };
      await service.deleteRecordsByIds('order', 'id', [10, 20, 30]);
      expect(mockPrisma.order.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: [10, 20, 30] } },
      });
    });

    it('returns the number of deleted records', async () => {
      mockPrisma.order = {
        deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
      };
      const deleted = await service.deleteRecordsByIds('order', 'id', [1, 2]);
      expect(deleted).toBe(2);
    });
  });
});
