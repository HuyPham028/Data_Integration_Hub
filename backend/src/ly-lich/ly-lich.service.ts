import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTcnsLyLichDto, UpdateTcnsLyLichDto } from './dto/ly-lich.dto';

@Injectable()
export class LyLichService {
  constructor(private prisma: PrismaService) {}

  async create(createLyLichDto: CreateTcnsLyLichDto) {
    return this.prisma.tcnsLyLich.create({ data: createLyLichDto });
  }

  async findAll() {
    return this.prisma.tcnsLyLich.findMany();
  }

  async findOne(id: number) {
    return this.prisma.tcnsLyLich.findUnique({ where: { id } });
  }

  async findByShcc(shcc: string) {
    return this.prisma.tcnsLyLich.findUnique({ where: { shcc } });
  }

  async update(id: number, updateLyLichDto: UpdateTcnsLyLichDto) {
    return this.prisma.tcnsLyLich.update({
      where: { id },
      data: updateLyLichDto,
    });
  }

  async remove(id: number) {
    return this.prisma.tcnsLyLich.delete({ where: { id } });
  }

  async searchByName(keyword: string) {
    return this.prisma.tcnsLyLich.findMany({
      where: {
        OR: [
          { ho: { contains: keyword, mode: 'insensitive' } },
          { ten: { contains: keyword, mode: 'insensitive' } },
        ],
      },
    });
  }
}
