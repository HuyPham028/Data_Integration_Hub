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
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ParseIntPipe } from '@nestjs/common';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('system_admin')
  @Get()
  findAll() {
    return this.rolesService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('system_admin')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.findById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('system_admin')
  @Post()
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.createRole(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('system_admin')
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateRoleDto>,
  ) {
    return this.rolesService.updateRole(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('system_admin')
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.deleteRole(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('system_admin')
  @Post(':roleId/permissions/:permissionId')
  assignPermission(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Param('permissionId', ParseIntPipe) permissionId: number,
  ) {
    return this.rolesService.assignPermission(roleId, permissionId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('system_admin')
  @Delete(':roleId/permissions/:permissionId')
  removePermission(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Param('permissionId', ParseIntPipe) permissionId: number,
  ) {
    return this.rolesService.removePermission(roleId, permissionId);
  }
}
