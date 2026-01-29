import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { MongooseModule, getConnectionToken } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { Connection } from 'mongoose';
import * as request from 'supertest';
import { App } from 'supertest/types';

describe('MongoDB Connection (e2e)', () => {
  let app: INestApplication<App>;
  let connection: Connection;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env',
        }),
        MongooseModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: async (config) => ({
            uri: config.get<string>('MONGO_URI'),
          }),
          inject: ['ConfigService'],
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    connection = moduleFixture.get<Connection>(getConnectionToken());
    await app.init();
  });

  afterAll(async () => {
    if (connection) {
      await connection.close();
    }
    await app.close();
  });

  it('should connect to MongoDB', () => {
    expect(connection.readyState).toBe(1);
  });

  it('should ping MongoDB', async () => {
    if (!connection.db) {
      throw new Error('Connection.db is undefined');
    }
    const result = await connection.db.admin().ping();
    expect(result.ok).toBe(1);
  });

  it('GET / should return 200', () => {
    return request(app.getHttpServer()).get('/').expect(200);
  });
});
