import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
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
    
    const uniqueId = crypto.randomUUID();
    const tempPath = path.join(process.cwd(), 'prisma', `schema.temp.${uniqueId}.prisma`);
    const realPath = path.join(process.cwd(), 'prisma', 'schema.prisma');

    await fs.writeFile(tempPath, tempSchemaStr);

    try {
      const { stdout } = await execAsync(
        `npx prisma migrate diff --from-schema ${realPath} --to-schema ${tempPath} --script`,
      );
      return stdout?.trim() || '-- No structural changes detected.';
    } catch (err: any) {
      if (err.stdout?.trim()) return err.stdout.trim();
      this.logger.error(`Preview generation failed: ${err.message}`);
      throw err;
    } finally {
      await fs.unlink(tempPath).catch(() => null);
    }
  }

  /**
   * Apply the (optionally user-edited) SQL migration:
   *  1. Create official Prisma migration name & checksum
   *  2. Execute SQL directly on PostgreSQL in a transaction
   *  3. Record the migration in _prisma_migrations to prevent CI/CD re-run errors
   *  4. Regenerate schema.prisma locally + prisma generate
   *  5. Hot-reload Prisma client in memory
   *  6. Commit schema.prisma + migration.sql to GitHub
   */
  async applyLiveMigration(tableName: string, customSql: string): Promise<void> {
    const realPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    this.logger.log(`[Migrator] Applying migration for "${tableName}"...`);

    // 1. Create Prisma-compliant timestamp (YYYYMMDDHHMMSS)
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const migrationName = `${timestamp}_${tableName}`;
    
    // Generate SHA256 checksum exactly like Prisma does
    const checksum = crypto.createHash('sha256').update(customSql).digest('hex');

    // Sanitize DROP statements: prisma migrate diff generates DROP INDEX/TABLE without
    // IF EXISTS, which crashes if the object doesn't exist (schema.prisma ↔ DB drift).
    // Adding IF EXISTS makes the migration idempotent and safe to re-run.
    const safeSql = customSql
      .replace(/DROP INDEX "([^"]+)"/g, 'DROP INDEX IF EXISTS "$1"')
      .replace(/DROP TABLE "([^"]+)"/g, 'DROP TABLE IF EXISTS "$1" CASCADE')
      .replace(/DROP COLUMN "([^"]+)"/g, 'DROP COLUMN IF EXISTS "$1"');

    // 2. Execute SQL directly on PostgreSQL using Transactions
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    try {
      await pool.query('BEGIN');

      // Drop all user-defined PostgreSQL views before altering tables.
      // PostgreSQL refuses ALTER COLUMN TYPE when a view depends on that column.
      // We read the live definitions from view_definitions, drop them, apply the
      // migration, then recreate them — all inside one transaction.
      const viewRows = await pool.query<{ view_name: string; sql_query: string }>(
        `SELECT view_name, sql_query FROM view_definitions WHERE is_active = true ORDER BY id`,
      );
      for (const row of viewRows.rows) {
        await pool.query(`DROP VIEW IF EXISTS "${row.view_name}" CASCADE`);
        this.logger.log(`[Migrator] Dropped view "${row.view_name}" (will recreate after migration).`);
      }

      // Run the structural changes (using safeSql with IF EXISTS guards)
      await pool.query(safeSql);

      // Recreate all views that were dropped above
      for (const row of viewRows.rows) {
        await pool.query(`CREATE OR REPLACE VIEW "${row.view_name}" AS ${row.sql_query}`);
        this.logger.log(`[Migrator] Recreated view "${row.view_name}".`);
      }

      // 3. Fake Prisma's migration tracking
      // This ensures that when CI/CD runs "prisma migrate deploy", it sees this
      // migration folder, checks the DB, and skips it instead of crashing.
      await pool.query(`
        INSERT INTO _prisma_migrations (
          id, checksum, finished_at, migration_name, logs,
          applied_steps_count, started_at
        ) VALUES (
          gen_random_uuid(), $1, now(), $2, NULL, 1, now()
        );
      `, [checksum, migrationName]);

      await pool.query('COMMIT');
      this.logger.log(`[Migrator] SQL executed successfully and registered in Prisma history.`);
    } catch (err: any) {
      await pool.query('ROLLBACK');
      this.logger.error(`[Migrator] SQL execution failed: ${err.message}`);
      throw new BadRequestException(err?.message || 'SQL execution failed.');
    } finally {
      await pool.end().catch(() => null);
    }

    // 4. Generate new schema.prisma and write locally
    const newSchemaStr = await this.schemaGenerator.generateFullSchema();
    await fs.writeFile(realPath, newSchemaStr);

    // 5. Regenerate Prisma Client types
    try {
      await execAsync('npx prisma generate');
      this.logger.log('[Migrator] Prisma Client regenerated.');
    } catch (err: any) {
      this.logger.warn(`[Migrator] prisma generate warning: ${err.message}`);
    }

    // 6. Hot-reload Prisma client in NestJS memory
    await this.prismaService.reload();

    // 7. Commit schema.prisma + migration.sql to GitHub
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