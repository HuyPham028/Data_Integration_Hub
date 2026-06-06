import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { snakeToCamel } from '../utils/string.util';
import { SchemaRegistryService } from 'src/common/schema-registry/schema-registry.service';
import { RoleSettings } from 'src/modules/users/users.service';

@Injectable()
export class MasterDataService {
  constructor(
    private prisma: PrismaService,
    private schemaRegistryService: SchemaRegistryService
  ) { }

  private resolveModelName(tableName: string): string {
    const mappedModel = Prisma.dmmf.datamodel.models.find((model) => model.dbName === tableName);
    if (mappedModel) {
      return mappedModel.name;
    }

    const camelName = snakeToCamel(tableName);
    const camelPascal = camelName.charAt(0).toUpperCase() + camelName.slice(1);
    const camelModel = Prisma.dmmf.datamodel.models.find((model) => model.name === camelPascal);
    if (camelModel) {
      return camelModel.name;
    }

    return camelName;
  }

  private getModel(tableName: string) {
    const modelName = this.resolveModelName(tableName);
    if (!this.prisma[modelName]) {
      throw new BadRequestException(
        `Table '${tableName}' does not exist or has not been declared in Prisma.`,
      );
    }
    return this.prisma[modelName];
  }

  private getModelFields(tableName: string): string[] {
    try {
      const modelName = this.resolveModelName(tableName);
      const modelMeta = Prisma.dmmf.datamodel.models.find((model) => model.name === modelName);
      if (!modelMeta) return [];
      return modelMeta.fields.map((field) => field.name);
    } catch (e) {
      return [];
    }
  }

  async findAll(
    tableName: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
  ) {
    const model = this.getModel(tableName);
    const skip = (Number(page) - 1) * Number(limit);

    const modelFields = this.getModelFields(tableName);

    const orConditions: any[] = [];
    if (search) {
      if (modelFields.includes('ma')) {
        orConditions.push({ ma: { contains: search, mode: 'insensitive' } });
      }
      if (modelFields.includes('ten')) {
        orConditions.push({ ten: { contains: search, mode: 'insensitive' } });
      }
    }

    const whereCondition = orConditions.length > 0 ? { OR: orConditions } : {};

    const [total, data] = await Promise.all([
      model.count({ where: whereCondition }),
      model.findMany({
        where: whereCondition,
        skip,
        take: Number(limit),
        ...(modelFields.includes('ma')
          ? { orderBy: { ma: 'asc' } }
          : modelFields.includes('id')
          ? { orderBy: { id: 'asc' } }
          : modelFields.includes('createdAt')
          ? { orderBy: { createdAt: 'desc' } }
          : {}),
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async findOne(tableName: string, id: number) {
    const model = this.getModel(tableName);
    const item = await model.findUnique({ where: { id: Number(id) } });
    if (!item)
      throw new NotFoundException(
        `Không tìm thấy bản ghi ID ${id} trong bảng ${tableName}`,
      );
    return item;
  }

  async create(tableName: string, data: any) {
    const model = this.getModel(tableName);
    return model.create({ data });
  }

  async update(tableName: string, id: number, data: any) {
    const model = this.getModel(tableName);
    await this.findOne(tableName, id);
    return model.update({ where: { id: Number(id) }, data });
  }

  async remove(tableName: string, id: number) {
    const model = this.getModel(tableName);
    await this.findOne(tableName, id);
    return model.delete({ where: { id: Number(id) } });
  }

  async executeRawQuery(sql: string): Promise<{
    columns: string[];
    rows: Record<string, unknown>[];
    rowCount: number;
    executionTime: number;
  }> {
    const trimmed = sql.trim();
    const upper = trimmed.toUpperCase();

    if (!upper.startsWith('SELECT') && !upper.startsWith('WITH')) {
      throw new BadRequestException('Chỉ cho phép câu lệnh SELECT hoặc WITH (CTE).');
    }

    const forbidden = /\b(INSERT|UPDATE|DELETE|DROP|TRUNCATE|ALTER|CREATE|GRANT|REVOKE|EXECUTE|EXEC)\b/i;
    if (forbidden.test(trimmed)) {
      throw new BadRequestException('Query chứa lệnh không được phép (INSERT/UPDATE/DELETE/DROP...).');
    }

    const start = Date.now();
    let raw: Record<string, unknown>[];
    try {
      raw = await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(trimmed);
    } catch (err: any) {
      const pgMessage =
        err?.meta?.message ||
        err?.message ||
        'Query thất bại.';
      throw new BadRequestException(pgMessage);
    }
    const executionTime = Date.now() - start;

    const capped = Array.isArray(raw) ? raw.slice(0, 500) : [];
    const rows = capped.map((row) => {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(row)) {
        out[k] = typeof v === 'bigint' ? Number(v) : v;
      }
      return out;
    });

    return {
      columns: rows.length > 0 ? Object.keys(rows[0]) : [],
      rows,
      rowCount: rows.length,
      executionTime,
    };
  }

  async getAllowedTablesForUser(user: any) {
    const allSchemas = await this.schemaRegistryService.getAllSchema();

    const mappedSchemas = allSchemas.map((schema) => ({
      id: schema.tableName,
      name: schema.tableName,
      description: schema.description || `Dữ liệu bảng ${schema.tableName}`,
    }));


    const settings = user.roleSettings as RoleSettings | null;
    if (!settings) return [];

    const allowedPatterns = [
      ...(settings.readScopes || []),
      ...(settings.writeScopes || []),
    ];

    if (allowedPatterns.length === 0) return [];

    const allowedTables = mappedSchemas.filter((table) => {
      return allowedPatterns.some((pattern) => {
        try {
          const regex = new RegExp(pattern);
          return regex.test(table.id);
        } catch (e) {
          return false;
        }
      });
    });

    return allowedTables;
  }
}
