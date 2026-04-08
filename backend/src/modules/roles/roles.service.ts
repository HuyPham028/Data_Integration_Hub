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
        type: dto.type,
        tablePatterns: dto.tablePatterns,
        description: dto.description,
      },
    });
  }

  async findById(id: number) {
    return this.prisma.role.findUnique({ where: { id } });
  }

  async findByName(roleName: string) {
    return this.prisma.role.findUnique({ where: { roleName } });
  }

  async findAll() {
    return this.prisma.role.findMany();
  }

  async updateRole(id: number, dto: Partial<CreateRoleDto>) {
    return this.prisma.role.update({
      where: { id },
      data: {
        ...(dto.roleName && { roleName: dto.roleName }),
        ...(dto.type && { type: dto.type }),
        ...(dto.tablePatterns && { tablePatterns: dto.tablePatterns }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });
  }

  async deleteRole(id: number) {
    return this.prisma.role.delete({ where: { id } });
  }
}
