import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
      include: { role: true },
    });
  }

  async findById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
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
    return this.prisma.user.update({
      where: { id },
      data: dto,
    });
  }

  async assignRole(userId: number, roleId: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { roleId },
      include: { role: true },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      include: { role: true },
    });
  }

  async getAllUsersPermissionSummary() {
    const users = await this.prisma.user.findMany({
      include: { role: true },
    });

    return users.map((user) => ({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role
        ? {
            id: user.role.id,
            roleName: user.role.roleName,
            type: user.role.type,
            tablePatterns: user.role.tablePatterns,
            description: user.role.description,
          }
        : null,
    }));
  }

  /**
   * Trả về thông tin role + danh sách bảng user có quyền truy cập.
   * Dùng để hiển thị lên FE.
   */
  async getUserPermissionSummary(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) return null;

    return {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role
        ? {
            id: user.role.id,
            roleName: user.role.roleName,
            type: user.role.type,
            tablePatterns: user.role.tablePatterns,
            description: user.role.description,
          }
        : null,
    };
  }

  /**
   * Overwrite danh sách tablePatterns của role thuộc user.
   * Chỉ cập nhật role của đúng user đó, không ảnh hưởng user khác cùng role.
   * Nếu user chưa có role → báo lỗi.
   */
  async updateUserTablePatterns(userId: number, tablePatterns: string[]) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user?.role) {
      throw new Error(`User ${userId} chưa được gán role.`);
    }

    if (user.role.type === 'admin') {
      throw new Error(`Không thể chỉnh sửa tablePatterns của role admin.`);
    }

    const updatedRole = await this.prisma.role.update({
      where: { id: user.role.id },
      data: { tablePatterns },
    });

    return {
      userId: user.id,
      username: user.username,
      role: {
        id: updatedRole.id,
        roleName: updatedRole.roleName,
        type: updatedRole.type,
        tablePatterns: updatedRole.tablePatterns,
      },
    };
  }
}
