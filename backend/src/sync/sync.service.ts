import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { snakeToCamel } from '../utils/string.util';

@Injectable()
export class SyncService {
  constructor(private prisma: PrismaService) {}

  /**
   * @param tableName
   * @param data
   */
  async syncMasterData(tableName: string, data: any[]) { // sync function for dm_tableName
    const modelName = snakeToCamel(tableName);

    // checking for model existence in prisma
    if (!this.prisma[modelName]) {
      throw new BadRequestException(`Table/Model '${modelName}' does not exist in Prisma Schema`);
    }

    const results = {
      tableName: tableName,
      total: data.length,
      success: 0,
      failed: 0,
      errors: [] as Array<{ ma: any; message: string }>,
    };

    console.log(`Begin syncing the table: ${modelName}`);

    for (const item of data) {
      try {
        const { ma, id, ...updatedData } = item

        await (this.prisma[modelName] as any).upsert({
          where: { ma: item.ma },
          update: updatedData,
          create: item,
        });

        results.success++;
      } catch (error) {
        console.error(`Error at line ${item.ma}:`, error.message);
        results.failed++;
        results.errors.push({ ma: item.ma, message: error.message });
      }
    }

    return results;
  }
}