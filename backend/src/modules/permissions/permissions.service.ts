import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { Permission } from './entities/permission.entity';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  async createPermission(dto: CreatePermissionDto): Promise<Permission> {
    return this.prisma.permission.create({
      data: {
        permission_key: dto.permission_key,
        description: dto.description,
      },
    });
  }

  async findById(id: string): Promise<Permission | null> {
    return this.prisma.permission.findUnique({
      where: { id },
    });
  }

  async findByKey(permission_key: string): Promise<Permission | null> {
    return this.prisma.permission.findUnique({
      where: { permission_key },
    });
  }

  async findAll(): Promise<Permission[]> {
    return this.prisma.permission.findMany();
  }

  async updatePermission(
    id: string,
    dto: Partial<CreatePermissionDto>,
  ): Promise<Permission> {
    return this.prisma.permission.update({
      where: { id },
      data: dto,
    });
  }

  async deletePermission(id: string): Promise<void> {
    await this.prisma.permission.delete({
      where: { id },
    });
  }
}
