import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getFarmers() {
    const users = await this.prisma.user.findMany({
      where: { role: 'FARMER' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        createdAt: true,
        farm: {
          select: {
            id: true,
            name: true,
            address: true,
            _count: { select: { cows: true } },
            cows: {
              select: { id: true, earTag: true, name: true, status: true },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      address: u.address,
      createdAt: u.createdAt,
      farm: u.farm
        ? {
            id: u.farm.id,
            name: u.farm.name,
            address: u.farm.address,
            cowCount: u.farm._count.cows,
            cows: u.farm.cows,
          }
        : null,
    }));
  }
}
