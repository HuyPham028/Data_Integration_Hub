import { PrismaSchemaGeneratorService } from './prisma-schema-generator.service';
import { Model } from 'mongoose';

const mockFindChain = (
  mockRegistryModel: any,
  result: any,
  reject = false,
) => {
  mockRegistryModel.find = jest.fn().mockReturnValue({
    lean: jest.fn().mockReturnValue({
      exec: reject
        ? jest.fn().mockRejectedValue(result)
        : jest.fn().mockResolvedValue(result),
    }),
  });
};

describe('PrismaSchemaGeneratorService', () => {
  let service: PrismaSchemaGeneratorService;
  let mockRegistryModel: Model<any>;

  beforeEach(() => {
    // Mock MongoDB Model
    mockRegistryModel = {
      find: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    } as any;

    service = new PrismaSchemaGeneratorService(mockRegistryModel);
  });
  it('preserves existing and newly added columns in output', async () => {
    const mockSchema = [{
      tableName: 'test_table',
      status: 'stable',
      primaryKey: ['id'],
      details: [
        { name: 'id', type: 'int', length: null },
        { name: 'name', type: 'varchar', length: 255 },
        { name: 'age', type: 'int', length: null },
      ]
    }];
    
    mockFindChain(mockRegistryModel, mockSchema);

    const generatedPrisma = await service.generateFullSchema();

    expect(generatedPrisma).toContain('generator client');
    expect(generatedPrisma).toContain('datasource');
    expect(generatedPrisma).toContain('model TestTable {');
    expect(generatedPrisma).toContain('name');
    expect(generatedPrisma).toContain('age');
  });

  it('maps common SQL types to Prisma types', async () => {
    const mockSchema = [{
      tableName: 'types_table',
      status: 'stable',
      primaryKey: ['id'],
      details: [
        { name: 'id', type: 'int' },
        { name: 'title', type: 'varchar', length: 200 },
        { name: 'created_at', type: 'datetime' },
        { name: 'is_active', type: 'boolean' },
        { name: 'score', type: 'double' },
      ],
    }];

    mockFindChain(mockRegistryModel, mockSchema);

    const generated = await service.generateFullSchema();

    // basic type mapping assertions (case-insensitive search)
    expect(generated.match(/id\s+Int/i)).toBeTruthy();
    expect(generated.match(/title\s+String/i)).toBeTruthy();
    expect(generated.match(/createdAt\s+DateTime/i)).toBeTruthy();
    expect(generated.match(/isActive\s+Boolean/i)).toBeTruthy();
    expect(generated.match(/score\s+Float|Decimal/i)).toBeTruthy();
  });

  // it('generates composite primary keys when provided', async () => {
  //   const mockSchema = [{
  //     tableName: 'composite_table',
  //     status: 'stable',
  //     primaryKey: ['tenant_id', 'entity_id'],
  //     details: [
  //       { name: 'tenant_id', type: 'varchar' },
  //       { name: 'entity_id', type: 'int' },
  //       { name: 'value', type: 'varchar' },
  //     ],
  //   }];

  //   mockFindChain(mockRegistryModel, mockSchema);

  //   const generated = await service.generateFullSchema();

  //   // Expect both fields to be present and an @@id block for composite key
  //   expect(generated).toContain('tenantId');
  //   expect(generated).toContain('entityId');
  //   expect(generated).toMatch(/@@id\s*\(\[.*tenantId.*\]\)/i);
  // });

  it('generates multiple models for multiple tables', async () => {
    const mockSchema = [
      { tableName: 'a', status: 'stable', primaryKey: ['id'], details: [{ name: 'id', type: 'int' }] },
      { tableName: 'b', status: 'stable', primaryKey: ['id'], details: [{ name: 'id', type: 'int' }] },
    ];

    mockFindChain(mockRegistryModel, mockSchema);

    const generated = await service.generateFullSchema();

    expect(generated).toContain('model A {');
    expect(generated).toContain('model B {');
  });

  // it('returns only header (generator+datasource) when registry is empty', async () => {
  //   mockFindChain(mockRegistryModel, []);

  //   const generated = await service.generateFullSchema();

  //   // should still include generator and datasource declarations
  //   expect(generated).toContain('generator client');
  //   expect(generated).toContain('datasource');
  //   // but no model blocks
  //   expect(generated).not.toMatch(/model\s+\w+\s*\{/i);
  // });

  it('throws a useful error when the registry query fails', async () => {
    mockFindChain(
      mockRegistryModel,
      new Error('db error'),
      true,
    ); 

    await expect(service.generateFullSchema()).rejects.toThrow(/db error/i);
  });
});