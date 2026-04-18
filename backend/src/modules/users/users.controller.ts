import {
  Controller, Get, Post, Body, Param,
  Put, UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { UsersService, RoleSettings } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /users/permissions — role + roleSettings của tất cả user (đặt trước :id)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('permissions')
  getAllPermissions() {
    return this.usersService.getAllUsersPermissionSummary();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.createUser(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.usersService.updateUser(id, dto);
  }

  // PUT /users/:id/role — gán role type (admin/reader/writer)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put(':id/role')
  assignRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { role: UserRole },
  ) {
    return this.usersService.assignRole(id, body.role);
  }

  // GET /users/:id/permissions — xem role + roleSettings của user
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get(':id/permissions')
  getPermissions(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getUserPermissionSummary(id);
  }

  // POST /users/:id/permissions — overwrite roleSettings
  // Body: { "writeScopes": ["^tcns_.*"], "readScopes": ["^dm_.*"] }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post(':id/permissions')
  updatePermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: RoleSettings,
  ) {
    return this.usersService.updateRoleSettings(id, body);
  }
}