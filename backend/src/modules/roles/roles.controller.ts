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
  findOne(@Param('id') id: string) {
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
  update(@Param('id') id: string, @Body() dto: Partial<CreateRoleDto>) {
    return this.rolesService.updateRole(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('system_admin')
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.rolesService.deleteRole(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('system_admin')
  @Post(':roleId/permissions/:permissionId')
  assignPermission(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    return this.rolesService.assignPermission(roleId, permissionId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('system_admin')
  @Delete(':roleId/permissions/:permissionId')
  removePermission(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    return this.rolesService.removePermission(roleId, permissionId);
  }
}
