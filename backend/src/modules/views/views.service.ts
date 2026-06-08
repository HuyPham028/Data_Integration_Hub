import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ViewsService {
  private readonly logger = new Logger(ViewsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private validateSql(sql: string): void {
    const normalized = sql.trim().toUpperCase();
    if (!normalized.startsWith('SELECT')) {
      throw new BadRequestException('SQL của view chỉ được bắt đầu bằng SELECT.');
    }
    const forbidden = [';', 'DROP ', 'INSERT ', 'UPDATE ', 'DELETE ', 'TRUNCATE ', 'ALTER ', 'CREATE '];
    for (const kw of forbidden) {
      if (normalized.includes(kw)) {
        throw new BadRequestException(`SQL không được chứa lệnh: "${kw.trim()}"`);
      }
    }
  }

  async listViews() {
    return this.prisma.viewDefinition.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createView(viewName: string, sqlQuery: string, description?: string) {
    this.validateSql(sqlQuery);

    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(viewName)) {
      throw new BadRequestException('Tên view chỉ được chứa chữ cái, số và dấu gạch dưới.');
    }

    await this.prisma.$executeRawUnsafe(
      `CREATE OR REPLACE VIEW "${viewName}" AS ${sqlQuery}`,
    );

    const record = await this.prisma.viewDefinition.upsert({
      where: { viewName },
      update: { sqlQuery, description, isActive: true, updatedAt: new Date() },
      create: { viewName, sqlQuery, description },
    });

    this.logger.log(`[VIEWS] Created/updated view: ${viewName}`);
    return record;
  }

  async updateView(id: number, sqlQuery: string, description?: string) {
    this.validateSql(sqlQuery);

    const existing = await this.prisma.viewDefinition.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`View ID ${id} không tồn tại.`);

    await this.prisma.$executeRawUnsafe(
      `CREATE OR REPLACE VIEW "${existing.viewName}" AS ${sqlQuery}`,
    );

    const record = await this.prisma.viewDefinition.update({
      where: { id },
      data: { sqlQuery, description, updatedAt: new Date() },
    });

    this.logger.log(`[VIEWS] Updated view: ${existing.viewName}`);
    return record;
  }

  async dropView(id: number) {
    const existing = await this.prisma.viewDefinition.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`View ID ${id} không tồn tại.`);

    await this.prisma.$executeRawUnsafe(`DROP VIEW IF EXISTS "${existing.viewName}"`);
    await this.prisma.viewDefinition.delete({ where: { id } });

    this.logger.log(`[VIEWS] Dropped view: ${existing.viewName}`);
    return { deleted: true, viewName: existing.viewName };
  }

  async previewView(sqlQuery: string, limit = 20): Promise<{ columns: string[]; rows: Record<string, unknown>[] }> {
    this.validateSql(sqlQuery);

    const safeLimit = Math.min(Math.max(1, limit), 100);
    const rows = await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT * FROM (${sqlQuery}) AS _preview LIMIT ${safeLimit}`,
    );

    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
    return { columns, rows };
  }
}
