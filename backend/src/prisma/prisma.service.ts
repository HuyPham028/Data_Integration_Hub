import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl || typeof databaseUrl !== 'string') {
      throw new Error('DATABASE_URL is missing or invalid. Please check your .env file.');
    }

    const adapter = new PrismaPg({ connectionString: databaseUrl });
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
