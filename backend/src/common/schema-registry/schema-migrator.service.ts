import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Pool } from 'pg';
import { PrismaSchemaGeneratorService } from '../prisma-schema-generator/prisma-schema-generator.service';
import { GitHubDeployService } from '../github-deploy/github-deploy.service';
import { PrismaService } from 'src/prisma/prisma.service';

const execAsync = promisify(exec);

@Injectable()
export class SchemaMigratorService {
  private readonly logger = new Logger(SchemaMigratorService.name);

  constructor(
    private readonly schemaGenerator: PrismaSchemaGeneratorService,
    private readonly githubDeploy: GitHubDeployService,
    private readonly prismaService: PrismaService,
  ) {}

  /**
   * Generate raw SQL diff for the Frontend GUI.
   * Uses `prisma migrate diff --script` to compare current schema vs predicted schema.
   */
  async getMigrationPreview(tableName: string, newDetails: any[]): Promise<string> {
    const tempSchemaStr = await this.schemaGenerator.generatePreviewSchema(tableName, newDetails);
    const tempPath = path.join(process.cwd(), 'prisma', 'schema.temp.prisma');
    const realPath = path.join(process.cwd(), 'prisma', 'schema.prisma');

    await fs.writeFile(tempPath, tempSchemaStr);

    try {
      const { stdout } = await execAsync(
        `npx prisma migrate diff --from-schema ${realPath} --to-schema ${tempPath} --script`,
      );
      return stdout?.trim() || '-- No structural changes detected.';
    } catch (err: any) {
      // prisma migrate diff exits with code 1 when there ARE differences — stdout still has the SQL
      if (err.stdout?.trim()) return err.stdout.trim();
      this.logger.error(`Preview generation failed: ${err.message}`);
      throw err;
    } finally {
      await fs.unlink(tempPath).catch(() => null);
    }
  }

  /**
   * Apply the (optionally user-edited) SQL migration:
   *  1. Execute SQL directly on PostgreSQL via pg.Pool
   *  2. Regenerate schema.prisma locally + prisma generate
   *  3. Hot-reload Prisma client in memory
   *  4. Commit schema.prisma + migration.sql to GitHub
   */
  async applyLiveMigration(tableName: string, customSql: string): Promise<void> {
    const realPath = path.join(process.cwd(), 'prisma', 'schema.prisma');

    this.logger.log(`[Migrator] Applying migration for "${tableName}"...`);

    // 1. Execute SQL directly on PostgreSQL (supports multiple statements)
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    try {
      await pool.query(customSql);
      this.logger.log(`[Migrator] SQL executed successfully on PostgreSQL.`);
    } finally {
      await pool.end();
    }

    // 2. Generate new schema.prisma and write locally
    const newSchemaStr = await this.schemaGenerator.generateFullSchema();
    await fs.writeFile(realPath, newSchemaStr);

    // 3. Regenerate Prisma Client types
    try {
      await execAsync('npx prisma generate');
      this.logger.log('[Migrator] Prisma Client regenerated.');
    } catch (err: any) {
      this.logger.warn(`[Migrator] prisma generate warning: ${err.message}`);
    }

    // 4. Hot-reload Prisma client in NestJS memory
    await this.prismaService.reload();

    // 5. Create a migration record folder path (timestamp-based)
    const migrationName = `${Date.now()}_${tableName}`;

    // 6. Commit schema.prisma + migration.sql to GitHub
    try {
      await this.githubDeploy.commitFiles(
        `chore(schema): apply drift migration for "${tableName}"`,
        [
          { path: 'backend/prisma/schema.prisma', content: newSchemaStr },
          {
            path: `backend/prisma/migrations/${migrationName}/migration.sql`,
            content: customSql,
          },
        ],
      );
      this.logger.log(`[Migrator] Committed schema + migration to GitHub.`);
    } catch (err: any) {
      // GitHub push failure is non-fatal — DB change already applied
      this.logger.error(`[Migrator] GitHub commit failed (non-fatal): ${err.message}`);
    }
  }
}
