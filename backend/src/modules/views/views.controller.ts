import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards, Query } from '@nestjs/common';
import { ViewsService } from './views.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('views')
export class ViewsController {
  constructor(private readonly viewsService: ViewsService) {}

  @Get()
  list() {
    return this.viewsService.listViews();
  }

  @Post()
  create(@Body() body: { viewName: string; sqlQuery: string; description?: string }) {
    return this.viewsService.createView(body.viewName, body.sqlQuery, body.description);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { sqlQuery: string; description?: string },
  ) {
    return this.viewsService.updateView(id, body.sqlQuery, body.description);
  }

  @Delete(':id')
  drop(@Param('id', ParseIntPipe) id: number) {
    return this.viewsService.dropView(id);
  }

  @Post('preview')
  preview(
    @Body() body: { sqlQuery: string },
    @Query('limit') limit?: string,
  ) {
    return this.viewsService.previewView(body.sqlQuery, limit ? parseInt(limit, 10) : 20);
  }
}
