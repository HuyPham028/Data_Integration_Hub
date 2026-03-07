import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { snakeToCamel } from '../utils/string.util';

@Injectable()
export class MasterDataService {
  constructor(private prisma: PrismaService) {}

  // Helper function to get the model
  private getModel(tableName: string) {
    const modelName = snakeToCamel(tableName);
    if (!this.prisma[modelName]) {
      throw new BadRequestException(`Table '${tableName}' does not exist or has not been declared in Prisma.`);
    }
    return this.prisma[modelName];
  }

  async findAll(tableName: string, page: number = 1, limit: number = 10, search?: string) {
    const model = this.getModel(tableName);
    const skip = (page - 1) * limit;

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
        skip: Number(skip),
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
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(tableName: string, id: number) {
    const model = this.getModel(tableName);
    const item = await model.findUnique({ where: { id: Number(id) } });
    if (!item) throw new NotFoundException(`Không tìm thấy bản ghi ID ${id} trong bảng ${tableName}`);
    return item;
  }

  async create(tableName: string, data: any) {
    const model = this.getModel(tableName);
    return model.create({ data });
  }

  async update(tableName: string, id: number, data: any) {
    const model = this.getModel(tableName);
    await this.findOne(tableName, id); 
    return model.update({
      where: { id: Number(id) },
      data,
    });
  }

  async remove(tableName: string, id: number) {
    const model = this.getModel(tableName);
    await this.findOne(tableName, id);
    return model.delete({ where: { id: Number(id) } });
  }
}