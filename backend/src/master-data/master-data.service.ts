import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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

  private getModel(tableName: string) {
    const modelName = snakeToCamel(tableName);
    if (!this.prisma[modelName]) {
      throw new BadRequestException(
        `Table '${tableName}' does not exist or has not been declared in Prisma.`,
      );
    }
    return this.prisma[modelName];
  }

  async findAll(
    tableName: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
  ) {
    const model = this.getModel(tableName);
    const skip = (Number(page) - 1) * Number(limit);

    const whereCondition = search
      ? {
          OR: [
            { ma: { contains: search, mode: 'insensitive' } },
            { ten: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [total, data] = await Promise.all([
      model.count({ where: whereCondition }),
      model.findMany({
        where: whereCondition,
        skip,
        take: Number(limit),
        orderBy: { ma: 'asc' },
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
