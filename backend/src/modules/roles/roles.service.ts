import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { Role } from './entities/role.entity';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async createRole(dto: CreateRoleDto): Promise<Role> {
    return this.prisma.role.create({
      data: {
        role_name: dto.role_name,
        description: dto.description,
      },
      include: { permissions: true },
    });
  }

  async findById(id: string): Promise<Role | null> {
    return this.prisma.role.findUnique({
      where: { id },
      include: { permissions: true },
    });
  }

  async findByName(role_name: string): Promise<Role | null> {
    return this.prisma.role.findUnique({
      where: { role_name },
      include: { permissions: true },
    });
  }

  async findAll(): Promise<Role[]> {
    return this.prisma.role.findMany({
      include: { permissions: true },
    });
  }

  async updateRole(id: string, dto: Partial<CreateRoleDto>): Promise<Role> {
    return this.prisma.role.update({
      where: { id },
      data: dto,
      include: { permissions: true },
    });
  }

  async deleteRole(id: string): Promise<void> {
    await this.prisma.role.delete({
      where: { id },
    });
  }

  async assignPermission(roleId: string, permissionId: string): Promise<void> {
    await this.prisma.role.update({
      where: { id: roleId },
      data: {
        permissions: {
          connect: { id: permissionId },
        },
      },
    });
  }

  async removePermission(roleId: string, permissionId: string): Promise<void> {
    await this.prisma.role.update({
      where: { id: roleId },
      data: {
        permissions: {
          disconnect: { id: permissionId },
        },
      },
    });
  }
}
