import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { SourceConfigService } from './source-config.service';
import { CreateSourceConfigDto } from './dto/create-source-config.dto';
import { UpdateSourceConfigDto } from './dto/update-source-config.dto';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../modules/auth/guards/roles.guard';
import { Roles } from '../../modules/auth/decorators/roles.decorator';

@Controller('source-configs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class SourceConfigController {
  constructor(private readonly sourceConfigService: SourceConfigService) {}

  // GET /source-configs
  @Get()
  findAll() {
    return this.sourceConfigService.findAll();
  }

  // GET /source-configs/:sourceId
  @Get(':sourceId')
  findOne(@Param('sourceId') sourceId: string) {
    return this.sourceConfigService.findOne(sourceId);
  }

  // POST /source-configs
  @Post()
  create(@Body() dto: CreateSourceConfigDto) {
    return this.sourceConfigService.create(dto);
  }

  // PUT /source-configs/:sourceId
  @Put(':sourceId')
  update(
    @Param('sourceId') sourceId: string,
    @Body() dto: UpdateSourceConfigDto,
  ) {
    return this.sourceConfigService.update(sourceId, dto);
  }

  // PATCH /source-configs/:sourceId/toggle-active
  @Patch(':sourceId/toggle-active')
  toggleActive(@Param('sourceId') sourceId: string) {
    return this.sourceConfigService.toggleActive(sourceId);
  }

  // DELETE /source-configs/:sourceId
  @Delete(':sourceId')
  remove(@Param('sourceId') sourceId: string) {
    return this.sourceConfigService.remove(sourceId);
  }
}
