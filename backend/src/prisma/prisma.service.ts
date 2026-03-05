import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg'; // 1. Import thêm Pool từ thư viện 'pg'

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // 2. Tạo một Pool kết nối từ DATABASE_URL trong .env
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    // 3. Truyền pool vào PrismaPg adapter
    const adapter = new PrismaPg(pool);

    // 4. Gọi super với adapter đã tạo
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
