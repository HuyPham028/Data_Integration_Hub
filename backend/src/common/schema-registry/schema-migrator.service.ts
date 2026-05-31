import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
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
   * Generate raw SQL diff for the Frontend GUI
   */
  async getMigrationPreview(tableName: string, newDetails: any[]): Promise<string> {
    const tempSchemaStr = await this.schemaGenerator.generatePreviewSchema(tableName, newDetails);
    const tempPath = path.join(process.cwd(), 'prisma', 'schema.temp.prisma');
    const realPath = path.join(process.cwd(), 'prisma', 'schema.prisma');

    await fs.writeFile(tempPath, tempSchemaStr);

    try {
      // Compare current real schema against the temporary predicted schema
      const { stdout } = await execAsync(
        `npx prisma migrate diff --from-schema ${realPath} --to-schema ${tempPath} --script`
      );
      return stdout || '-- No structural changes detected.';
    } catch (error) {
      this.logger.error(`Preview generation failed: ${error.message}`);
      throw error;
    } finally {
      await fs.unlink(tempPath).catch(() => null);
    }
  }

  /**
   * Apply changes locally, reload server memory, and push files to GitHub
   */
  async applyLiveMigration(tableName: string): Promise<void> {
    const realPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    const migrationDir = path.join(process.cwd(), 'prisma', 'migrations');
    
    // 1. Generate new schema & overwrite file
    const newSchemaStr = await this.schemaGenerator.generateFullSchema();
    await fs.writeFile(realPath, newSchemaStr);

    try {
      this.logger.log(`[Migrator] Creating migration file for ${tableName}...`);
      const migName = `update_${tableName}_${Date.now()}`;
      
      // 2. Create the SQL migration file locally (does not execute it)
      await execAsync(`npx prisma migrate dev --name ${migName} --create-only`);

      // 3. Apply the migration to the PostgreSQL DB
      this.logger.log(`[Migrator] Deploying migration...`);
      await execAsync(`npx prisma migrate deploy`);

      // 4. Generate the new Prisma Client
      this.logger.log(`[Migrator] Generating new Prisma Client JS...`);
      await execAsync(`npx prisma generate`);

      // 5. Reload Prisma Client dynamically without crashing NestJS
      await this.prismaService.reload();

      // 6. Find the newly created SQL file to push to Git
      const folders = await fs.readdir(migrationDir);
      const latestFolder = folders.filter(f => f.includes(migName)).pop();
      
      const filesToCommit = [{ path: 'backend/prisma/schema.prisma', content: newSchemaStr }];
      
      if (latestFolder) {
        const sqlPath = path.join(migrationDir, latestFolder, 'migration.sql');
        const sqlContent = await fs.readFile(sqlPath, 'utf-8');
        filesToCommit.push({
          path: `backend/prisma/migrations/${latestFolder}/migration.sql`,
          content: sqlContent,
        });
      }

      // 7. Commit Schema + Migration history to GitHub
      await this.githubDeploy.commitFiles(`chore: apply schema drift for ${tableName}`, filesToCommit);

    } catch (error) {
      this.logger.error(`[Migrator] Failed to apply migration: ${error.message}`);
      throw error;
    }
  }
}