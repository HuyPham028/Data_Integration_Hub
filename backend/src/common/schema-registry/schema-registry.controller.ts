import { Controller, Post, Body, Get, Put, Param, UseGuards } from '@nestjs/common';
import { SchemaRegistryService } from './schema-registry.service';
import { UpdateSchemaRegistryDto } from './dto/update-schema-registry.dto';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../modules/auth/guards/roles.guard';
import { Roles } from '../../modules/auth/decorators/roles.decorator';

@Controller('schema-registry')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class SchemaRegistryController {
  constructor(private readonly schemaRegistryService: SchemaRegistryService) {}

  @Post('import')
  async importMetadata(@Body() rawData: any[]) {
    return this.schemaRegistryService.importSchemaData(rawData);
  }

  @Get()
  async getAll() {
    return this.schemaRegistryService.getAllSchemasForAdmin();
  }

  @Put(':tableName/resolve')
  async resolveWarning(@Param('tableName') tableName: string) {
    return this.schemaRegistryService.resolveSchemaWarning(tableName);
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
}