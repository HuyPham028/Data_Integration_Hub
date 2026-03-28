import { Controller, Post, Body, Get, Put, Param } from '@nestjs/common';
import { SchemaRegistryService } from './schema-registry.service';
import { UpdateSchemaRegistryDto } from './dto/update-schema-registry.dto';

@Controller('schema-registry')
export class SchemaRegistryController {
  constructor(private readonly schemaRegistryService: SchemaRegistryService) {}

  @Post('import')
  async importMetadata(@Body() rawData: any[]) {
    return await this.schemaRegistryService.importSchemaData(rawData);
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
  async runDetectorMock(@Body() incomingData: any[]) {
    return this.schemaRegistryService.detectSchemaChanges(incomingData);
  }
}