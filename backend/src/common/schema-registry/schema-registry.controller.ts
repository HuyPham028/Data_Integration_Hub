import { Controller, Post, Body, Get, Put, Patch, Param, UseGuards, HttpCode, NotFoundException } from '@nestjs/common';
import { SchemaRegistryService } from './schema-registry.service';
import { UpdateSchemaRegistryDto } from './dto/update-schema-registry.dto';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../modules/auth/guards/roles.guard';
import { Roles } from '../../modules/auth/decorators/roles.decorator';
import { SchemaMigratorService } from './schema-migrator.service';

@Controller('schema-registry')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class SchemaRegistryController {
  constructor(
    private readonly schemaRegistryService: SchemaRegistryService,
    private readonly schemaMigratorService: SchemaMigratorService,
  ) {}

  @Post('import')
  async importMetadata(@Body() rawData: any[]) {
    return this.schemaRegistryService.importSchemaData(rawData);
  }

  @Get()
  async getAll() {
    return this.schemaRegistryService.getAllSchemasForAdmin();
  }

  // @Put('resolve-all')
  // @HttpCode(200)
  // async resolveAllWarnings() {
  //   return this.schemaRegistryService.resolveAllWarnings();
  // }

  @Put(':tableName/resolve')
  @HttpCode(200)
  async resolveWarning(
    @Param('tableName') tableName: string,
    @Body('sql') sql?: string,
  ) {
    // Mark stable FIRST so generateFullSchema() includes this table in the new schema.prisma
    const updated = await this.schemaRegistryService.markAsStable(tableName);

    if (sql?.trim()) {
      // New flow: user reviewed + (optionally edited) the SQL → apply live
      await this.schemaMigratorService.applyLiveMigration(tableName, sql);
    }

    return updated;
  }

  @Put(':tableName')
  async update(
    @Param('tableName') tableName: string,
    @Body() updatePayload: UpdateSchemaRegistryDto,
  ) {
    return this.schemaRegistryService.updateSchema(tableName, updatePayload);
  }

  @Post('run-detector')
  async runDetector(@Body() incomingData: any[]) {
    return this.schemaRegistryService.detectSchemaChanges(incomingData);
  }

  @Patch(':tableName/strategy')
  @HttpCode(200)
  async updateStrategy(
    @Param('tableName') tableName: string,
    @Body('strategy') strategy: string,
  ) {
    return this.schemaRegistryService.updateSyncStrategy(
      tableName,
      strategy as 'upsert' | 'overwrite' | 'incremental',
    );
  }

  @Put(':tableName/reject')
  async rejectWarning(@Param('tableName') tableName: string) {
    return this.schemaRegistryService.rejectSchemaWarning(tableName);
  }

  // @Post('migrate-standard-hash')
  // async runHashMigration() {
  //   return this.schemaRegistryService.migrateAllToStandardHash();
  // }

  @Get('preview-sql/:tableName')
  async previewSql(@Param('tableName') tableName: string) {
    const schema = await this.schemaRegistryService.getSchemaByName(tableName);

    if (!schema) {
      throw new NotFoundException(`Schema '${tableName}' not found`);
    }

    const sql = await this.schemaMigratorService.getMigrationPreview(
      tableName,
      schema.details,
    );

    return { sql };
  }
}