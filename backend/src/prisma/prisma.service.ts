import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl || typeof databaseUrl !== 'string') {
      throw new Error('DATABASE_URL is missing or invalid. Please check your .env file.');
    }

    const pool = new Pool({
      connectionString: databaseUrl,
      max: parseInt(process.env.DB_POOL_MAX ?? '10', 10),
      idleTimeoutMillis: 30_000,       // đóng connection nhàn rỗi sau 30s
      connectionTimeoutMillis: 5_000,  // lỗi ngay sau 5s nếu không lấy được connection
    });

    pool.on('error', (err) => {
      new Logger('PgPool').error(`Unexpected pg pool error: ${err.message}`);
    });

    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async reload() {
    this.logger.warn('Hot-reloading Prisma Client dynamically...');
    await this.$disconnect();
    
    // Purge the newly generated client from Node's require cache
    const clientPath = require.resolve('.prisma/client');
    if (require.cache[clientPath]) {
      delete require.cache[clientPath];
    }
    
    await this.$connect();
    this.logger.log('Prisma Client reloaded successfully.');
  }
}
