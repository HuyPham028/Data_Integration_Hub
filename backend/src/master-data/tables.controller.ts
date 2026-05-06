import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { MasterDataService } from './master-data.service';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';

@Controller('/tables')
@UseGuards(JwtAuthGuard)
export class TablesController {
  constructor(private readonly masterDataService: MasterDataService) {}

  @Get('allowed')
  async getAllowedTables(@Request() req) {
    return this.masterDataService.getAllowedTablesForUser(req.user);
  }
}