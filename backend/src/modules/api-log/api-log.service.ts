import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ApiLogService {
  constructor(private readonly prisma: PrismaService) {}

  async getLogs(opts: {
    tableName?: string;
    username?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  }) {
    const { tableName, username, fromDate, toDate, page = 1, limit = 50 } = opts;

    const where = {
      ...(tableName ? { tableName: { contains: tableName, mode: 'insensitive' as const } } : {}),
      ...(username ? { username: { contains: username, mode: 'insensitive' as const } } : {}),
      createdAt: {
        ...(fromDate ? { gte: new Date(fromDate) } : {}),
        ...(toDate ? { lte: new Date(new Date(toDate).setHours(23, 59, 59, 999)) } : {}),
      },
    };

    const [total, logs] = await Promise.all([
      this.prisma.apiAccessLog.count({ where }),
      this.prisma.apiAccessLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          username: true,
          tableName: true,
          method: true,
          statusCode: true,
          responseTimeMs: true,
          ipAddress: true,
          createdAt: true,
        },
      }),
    ]);

    return { total, page, limit, logs };
  }

  async getSummary(days = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [byTable, byUser, byDay] = await Promise.all([
      // Top bảng được truy cập
      this.prisma.apiAccessLog.groupBy({
        by: ['tableName'],
        where: { createdAt: { gte: since } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      // Top user gọi nhiều nhất
      this.prisma.apiAccessLog.groupBy({
        by: ['username'],
        where: { createdAt: { gte: since } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      // Request theo ngày
      this.prisma.$queryRaw<{ date: string; count: bigint }[]>`
        SELECT DATE(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh') as date,
               COUNT(*) as count
        FROM api_access_logs
        WHERE created_at >= ${since}
        GROUP BY date
        ORDER BY date ASC
      `,
    ]);

    return {
      byTable: byTable.map((r) => ({ table: r.tableName, count: r._count.id })),
      byUser: byUser.map((r) => ({ user: r.username ?? 'anonymous', count: r._count.id })),
      byDay: byDay.map((r) => ({ date: r.date, count: Number(r.count) })),
    };
  }
}
