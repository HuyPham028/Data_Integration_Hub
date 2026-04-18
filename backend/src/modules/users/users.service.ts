import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Prisma, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export interface RoleSettings {
  writeScopes: string[];
  readScopes: string[];
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({ where: { username } });
  }

  async findById(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async createUser(dto: CreateUserDto) {
    const hashed = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        passwordHash: hashed,
        fullName: dto.fullName,
      },
    });
  }

  async updateUser(id: number, dto: UpdateUserDto) {
    return this.prisma.user.update({ where: { id }, data: dto });
  }

  async findAll() {
    return this.prisma.user.findMany();
  }

  /** Trả về thông tin role + roleSettings của một user (cho FE) */
  async getUserPermissionSummary(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User ${userId} không tồn tại`);

    return {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      roleSettings: user.roleSettings ?? null,
    };
  }

  /** Trả về role + roleSettings của tất cả user (cho FE admin) */
  async getAllUsersPermissionSummary() {
    const users = await this.prisma.user.findMany();
    return users.map((u) => ({
      userId: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      roleSettings: u.roleSettings ?? null,
    }));
  }

  /** Gán role type cho user (admin/reader/writer) */
  async assignRole(userId: number, role: UserRole) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User ${userId} không tồn tại`);

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        role,
        // Admin không cần roleSettings
        roleSettings: role === UserRole.admin ? Prisma.JsonNull : (user.roleSettings as Prisma.InputJsonValue),
      },
      select: { id: true, username: true, email: true, role: true, roleSettings: true },
    });
  }

  /**
   * Overwrite roleSettings của user.
   * Format YAML-like lưu dưới JSON:
   * {
   *   "writeScopes": ["^tcns_.*", "^dm_gioi_tinh$"],
   *   "readScopes":  ["^nguoi_hoc$", "^dm_.*"]
   * }
   */
  private validateRegexPatterns(patterns: string[], field: string): void {
    const invalid: string[] = [];
    for (const pattern of patterns) {
      try {
        new RegExp(pattern);
      } catch {
        invalid.push(pattern);
      }
    }
    if (invalid.length > 0) {
      throw new BadRequestException(
        `${field} chứa regex không hợp lệ: ${invalid.map(p => `"${p}"`).join(', ')}`,
      );
    }
  }

  async updateRoleSettings(userId: number, roleSettings: RoleSettings) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User ${userId} không tồn tại`);

    if (user.role === UserRole.admin) {
      throw new BadRequestException('Admin không cần cấu hình roleSettings.');
    }

    // Validate cú pháp regex trước khi lưu
    this.validateRegexPatterns(roleSettings.writeScopes ?? [], 'writeScopes');
    this.validateRegexPatterns(roleSettings.readScopes ?? [], 'readScopes');

    return this.prisma.user.update({
      where: { id: userId },
      data: { roleSettings: roleSettings as unknown as Prisma.InputJsonValue },
      select: { id: true, username: true, email: true, role: true, roleSettings: true },
    });
  }
}