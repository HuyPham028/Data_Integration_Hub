import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { PassThrough } from 'stream';

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private client: Minio.Client;
  private publicClient: Minio.Client;
  readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.get<string>('MINIO_BUCKET', 'data-hub-backups');
    this.client = new Minio.Client({
      endPoint: this.config.get<string>('MINIO_ENDPOINT', 'localhost'),
      port: parseInt(this.config.get<string>('MINIO_PORT', '9000'), 10),
      useSSL: this.config.get<string>('MINIO_USE_SSL', 'false') === 'true',
      accessKey: this.config.get<string>('MINIO_ACCESS_KEY', 'admin'),
      secretKey: this.config.get<string>('MINIO_SECRET_KEY', 'password123'),
    });

    this.publicClient = new Minio.Client({
      endPoint: this.config.get<string>('MINIO_PUBLIC_ENDPOINT', 'localhost'),
      port: parseInt(this.config.get<string>('MINIO_PUBLIC_PORT', '9000'), 10),
      useSSL: this.config.get<string>('MINIO_PUBLIC_USE_SSL', 'false') === 'true',
      accessKey: this.config.get<string>('MINIO_ACCESS_KEY', 'admin'),
      secretKey: this.config.get<string>('MINIO_SECRET_KEY', 'password123'),
      region: 'ap-southeast-1',
    });
  }

  async onModuleInit() {
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(this.bucket);
        this.logger.log(`Bucket "${this.bucket}" created.`);
      } else {
        this.logger.log(`Bucket "${this.bucket}" ready.`);
      }
    } catch (err) {
      this.logger.error(`MinIO init failed: ${err.message}`);
    }
  }

  async uploadJson(objectKey: string, data: unknown): Promise<void> {
    const content = JSON.stringify(data, null, 2);
    const buffer = Buffer.from(content, 'utf-8');
    await this.client.putObject(this.bucket, objectKey, buffer, buffer.length, {
      'Content-Type': 'application/json',
    });
  }

  /**
   * Stream upload: đọc records theo từng batch, ghi JSON từng phần lên MinIO.
   * RAM luôn ở mức O(batchSize) thay vì O(totalRecords).
   *
   * @param objectKey  Key MinIO
   * @param meta       Thông tin meta (tableName, trigger, backedUpAt, recordCount)
   * @param fetchBatch Hàm nhận (skip, take) → trả về batch records
   * @param totalCount Tổng số records (từ COUNT(*) trước)
   */
  async uploadJsonStream(
    objectKey: string,
    meta: Record<string, unknown>,
    fetchBatch: (skip: number, take: number) => Promise<unknown[]>,
    totalCount: number,
    batchSize = 5000,
  ): Promise<void> {
    const BATCH_SIZE = batchSize;
    const passThrough = new PassThrough();

    // Upload chạy song song với việc ghi stream
    const uploadPromise = this.client.putObject(
      this.bucket,
      objectKey,
      passThrough,
      undefined,          // không cần Content-Length khi stream
      { 'Content-Type': 'application/json' },
    );

    // Ghi JSON header + data từng batch
    passThrough.write(`{\n  "meta": ${JSON.stringify({ ...meta, recordCount: totalCount })},\n  "data": [\n`);

    let skip = 0;
    let isFirst = true;
    while (skip < totalCount) {
      const batch = await fetchBatch(skip, BATCH_SIZE);
      for (const record of batch) {
        passThrough.write((isFirst ? '    ' : ',\n    ') + JSON.stringify(record));
        isFirst = false;
      }
      skip += BATCH_SIZE;
    }

    passThrough.end('\n  ]\n}\n');
    await uploadPromise;
  }

  async listObjects(prefix: string): Promise<Minio.BucketItem[]> {
    return new Promise((resolve, reject) => {
      const items: Minio.BucketItem[] = [];
      const stream = this.client.listObjects(this.bucket, prefix, true);
      stream.on('data', (item: Minio.BucketItem) => items.push(item));
      stream.on('end', () => resolve(items));
      stream.on('error', reject);
    });
  }

  async deleteObject(objectKey: string): Promise<void> {
    await this.client.removeObject(this.bucket, objectKey);
  }

  async deleteObjects(objectKeys: string[]): Promise<void> {
    if (objectKeys.length === 0) return;
    await this.client.removeObjects(this.bucket, objectKeys);
  }

  async getPresignedUrl(objectKey: string, expirySeconds = 3600): Promise<string> {
    return this.publicClient.presignedGetObject(this.bucket, objectKey, expirySeconds);
  }

  async downloadJson<T = unknown>(objectKey: string): Promise<T> {
    const stream = await this.client.getObject(this.bucket, objectKey);
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', () => {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString('utf-8')) as T);
        } catch (e) {
          reject(new Error(`Failed to parse JSON from object "${objectKey}": ${e.message}`));
        }
      });
      stream.on('error', reject);
    });
  }

  async getObjectStream(objectKey: string): Promise<{ stream: NodeJS.ReadableStream; size: number }> {
    const stat = await this.client.statObject(this.bucket, objectKey);
    const stream = await this.client.getObject(this.bucket, objectKey);
    return { stream, size: stat.size };
  }
}
