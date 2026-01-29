import { Controller, Get, Param } from '@nestjs/common';
import { ApiSchemasService } from './api-schemas.service';

@Controller('api-schemas')
export class ApiSchemasController {
  constructor(private readonly apiSchemasService: ApiSchemasService) {}

  @Get()
  findAll() {
    return this.apiSchemasService.findAll();
  }

  @Get(':tableName')
  findOne(@Param('tableName') tableName: string) {
    return this.apiSchemasService.findOne(tableName);
  }
}
