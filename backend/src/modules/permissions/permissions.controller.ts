import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ParseIntPipe } from '@nestjs/common';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('system_admin')
  @Get()
  findAll() {
    return this.permissionsService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('system_admin')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.findById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('system_admin')
  @Post()
  create(@Body() dto: CreatePermissionDto) {
    return this.permissionsService.createPermission(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('system_admin')
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreatePermissionDto>,
  ) {
    return this.permissionsService.updatePermission(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('system_admin')
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.deletePermission(id);
  }
}
