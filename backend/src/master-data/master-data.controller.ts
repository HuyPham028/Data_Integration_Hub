import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { MasterDataService } from './master-data.service';

@Controller('api/master-data')
export class MasterDataController {
  constructor(private readonly masterDataService: MasterDataService) {}

  /*
   *Example GET /api/master-data/dm_gioi_tinh?page=1&limit=20&search=Nam
  */
  @Get(':table')
  findAll(
    @Param('table') table: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('search') search: string,
  ) {
    return this.masterDataService.findAll(table, page, limit, search);
  }

  // Example GET /api/master-data/dm_gioi_tinh/1
  @Get(':table/:id')
  findOne(@Param('table') table: string, @Param('id') id: string) {
    return this.masterDataService.findOne(table, +id);
  }

  // Need Authentication later 

  @Post(':table')
  create(@Param('table') table: string, @Body() body: any) {
    return this.masterDataService.create(table, body);
  }

  @Patch(':table/:id')
  update(@Param('table') table: string, @Param('id') id: string, @Body() body: any) {
    return this.masterDataService.update(table, +id, body);
  }

  @Delete(':table/:id')
  remove(@Param('table') table: string, @Param('id') id: string) {
    return this.masterDataService.remove(table, +id);
  }
}