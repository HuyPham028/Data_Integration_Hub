import { Controller, Post, Body } from '@nestjs/common';
import { SchemaRegistryService } from './schema-registry.service';

@Controller('api/v1/schema-registry')
export class SchemaRegistryController {
  constructor(private readonly schemaRegistryService: SchemaRegistryService) {}

  @Post('import')
  async importMetadata(@Body() rawData: any[]) {
    return await this.schemaRegistryService.importSchemaData(rawData);
  }
}