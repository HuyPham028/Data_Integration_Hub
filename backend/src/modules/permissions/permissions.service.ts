import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { PrismaClient, Permission } from '@prisma/client';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  async createPermission(dto: CreatePermissionDto): Promise<Permission> {
    return this.prisma.permission.create({
      data: {
        permissionKey: dto.permissionKey,
        description: dto.description,
      },
    });
  }

  async findById(id: number): Promise<Permission | null> {
    return this.prisma.permission.findUnique({
      where: { id },
    });
  }

  async findByKey(permissionKey: string): Promise<Permission | null> {
    return this.prisma.permission.findUnique({
      where: { permissionKey },
    });
  }

  async findAll(): Promise<Permission[]> {
    return this.prisma.permission.findMany();
  }

  async updatePermission(
    id: number,
    dto: Partial<CreatePermissionDto>,
  ): Promise<Permission> {
    return this.prisma.permission.update({
      where: { id },
      data: dto,
    });
  }

  async deletePermission(id: number): Promise<void> {
    await this.prisma.permission.delete({
      where: { id },
    });
  }
}
