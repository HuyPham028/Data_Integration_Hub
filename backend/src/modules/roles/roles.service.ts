import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async createRole(dto: CreateRoleDto) {
    return this.prisma.role.create({
      data: {
        roleName: dto.roleName,
        description: dto.description,
      },
    });
  }

  async findById(id: number) {
    return this.prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    });
  }

  async findByName(roleName: string) {
    return this.prisma.role.findUnique({
      where: { roleName },
    });
  }

  async findAll() {
    return this.prisma.role.findMany({
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    });
  }

  async updateRole(id: number, dto: Partial<CreateRoleDto>) {
    return this.prisma.role.update({
      where: { id },
      data: dto,
    });
  }

  async deleteRole(id: number) {
    return this.prisma.role.delete({
      where: { id },
    });
  }

  async assignPermission(roleId: number, permissionId: number) {
    return this.prisma.rolePermission.create({
      data: { roleId, permissionId },
    });
  }

  async removePermission(roleId: number, permissionId: number) {
    return this.prisma.rolePermission.delete({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });
  }
}
