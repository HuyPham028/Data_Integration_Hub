import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule, getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

describe('AppModule - MongoDB Connection', () => {
  let module: TestingModule;
  let connection: Connection;
  let configService: ConfigService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env',
        }),
        MongooseModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: async (configService: ConfigService) => ({
            uri: configService.get<string>('MONGO_URI'),
          }),
          inject: [ConfigService],
        }),
      ],
    }).compile();

    configService = module.get<ConfigService>(ConfigService);
    connection = module.get<Connection>(getConnectionToken());
  });

  afterAll(async () => {
    if (connection) {
      await connection.close();
    }
    await module.close();
  });

  it('should load MONGO_URI from .env', () => {
    const mongoUri = configService.get<string>('MONGO_URI');
    expect(mongoUri).toBeDefined();
    expect(mongoUri).toContain('mongodb');
  });

  it('should establish MongoDB connection', async () => {
    expect(connection).toBeDefined();
    expect(connection.readyState).toBe(1);
  });

  it('should have valid connection string', async () => {
    const mongoUri = configService.get<string>('MONGO_URI');
    expect(mongoUri).toMatch(/mongodb(\+srv)?:\/\//);
  });

  it('should verify database is accessible', async () => {
    if (!connection.db) {
      throw new Error('Connection.db is undefined');
    }
    const status = await connection.db.admin().ping();
    expect(status).toHaveProperty('ok');
  });
});
