import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCowDto } from './dto/create-cow.dto';
import { UpdateCowDto } from './dto/update-cow.dto';

interface RequestUser {
  id: string;
  role: Role;
}

@Injectable()
export class CowService {
  constructor(private readonly prisma: PrismaService) {}

  private async getFarmIdForUser(userId: string): Promise<string> {
    const farm = await this.prisma.farm.findUnique({ where: { ownerId: userId } });
    if (!farm) throw new ForbiddenException('Farm tidak ditemukan untuk akun ini');
    return farm.id;
  }

  async create(dto: CreateCowDto, user: RequestUser) {
    let farmId: string;

    if (user.role === Role.ADMIN) {
      if (!dto.farmId) throw new ForbiddenException('farmId wajib diisi oleh admin');
      farmId = dto.farmId;
    } else {
      farmId = await this.getFarmIdForUser(user.id);
    }

    const existing = await this.prisma.cow.findUnique({ where: { earTag: dto.earTag } });
    if (existing) throw new ConflictException('Nomor earTag sudah terdaftar. Gunakan nomor earTag yang berbeda.');

    return this.prisma.cow.create({
      data: {
        earTag: dto.earTag,
        name: dto.name,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        parity: dto.parity,
        currentWeight: dto.currentWeight,
        currentBCS: dto.currentBCS,
        lactationMonth: dto.lactationMonth,
        status: dto.status,
        farmId,
      },
      include: { farm: { select: { id: true, name: true } } },
    });
  }

  async findAll(
    user: RequestUser,
    filters: { farmId?: string; status?: string },
  ) {
    const where: Record<string, unknown> = {};

    if (user.role === Role.ADMIN) {
      if (filters.farmId) where.farmId = filters.farmId;
    } else {
      const farmId = await this.getFarmIdForUser(user.id);
      where.farmId = farmId;
    }

    if (filters.status) where.status = filters.status;

    return this.prisma.cow.findMany({
      where,
      include: { farm: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: RequestUser) {
    const cow = await this.prisma.cow.findUnique({
      where: { id },
      include: { farm: { select: { id: true, name: true, ownerId: true } } },
    });

    if (!cow) throw new NotFoundException('Sapi tidak ditemukan');

    if (user.role === Role.FARMER && cow.farm.ownerId !== user.id) {
      throw new ForbiddenException('Anda tidak memiliki akses ke sapi ini');
    }

    return cow;
  }

  async update(id: string, dto: UpdateCowDto, user: RequestUser) {
    const cow = await this.findOne(id, user);

    return this.prisma.cow.update({
      where: { id: cow.id },
      data: {
        ...(dto.earTag !== undefined && { earTag: dto.earTag }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.birthDate !== undefined && { birthDate: new Date(dto.birthDate) }),
        ...(dto.parity !== undefined && { parity: dto.parity }),
        ...(dto.currentWeight !== undefined && { currentWeight: dto.currentWeight }),
        ...(dto.currentBCS !== undefined && { currentBCS: dto.currentBCS }),
        ...(dto.lactationMonth !== undefined && { lactationMonth: dto.lactationMonth }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
      include: { farm: { select: { id: true, name: true } } },
    });
  }

  async listFarms() {
    return this.prisma.farm.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  async remove(id: string) {
    const cow = await this.prisma.cow.findUnique({ where: { id } });
    if (!cow) throw new NotFoundException('Sapi tidak ditemukan');

    return this.prisma.cow.update({
      where: { id },
      data: { status: 'CULLED' },
    });
  }
}
