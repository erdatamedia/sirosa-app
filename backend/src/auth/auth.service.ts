import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // Generate farmerId: PTR001, PTR002, ...
    const lastFarmer = await this.prisma.user.findFirst({
      where: { farmerId: { not: null } },
      orderBy: { farmerId: 'desc' },
    });

    let nextNum = 1;
    if (lastFarmer?.farmerId) {
      const num = parseInt(lastFarmer.farmerId.replace('PTR', ''), 10);
      if (!isNaN(num)) nextNum = num + 1;
    }

    const farmerId = `PTR${String(nextNum).padStart(3, '0')}`;

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        farmerId,
        phone: dto.phone,
        address: dto.address,
        role: 'FARMER',
        ...(dto.farmName
          ? {
              farm: {
                create: {
                  name: dto.farmName,
                  address: dto.address,
                },
              },
            }
          : {}),
      },
      select: {
        id: true,
        farmerId: true,
        name: true,
        role: true,
        phone: true,
        address: true,
        createdAt: true,
      },
    });

    const token = this.signToken(user.id, null, user.role);
    return { token, user };
  }

  async login(dto: LoginDto) {
    if (dto.identifier.includes('@')) {
      // Admin / Petugas login by email + password
      const user = await this.prisma.user.findUnique({
        where: { email: dto.identifier },
      });

      if (!user) throw new UnauthorizedException('Email atau password salah');
      if (!dto.password) throw new UnauthorizedException('Password diperlukan untuk login admin');
      if (!user.password) throw new UnauthorizedException('Email atau password salah');

      const valid = await bcrypt.compare(dto.password, user.password);
      if (!valid) throw new UnauthorizedException('Email atau password salah');

      const { password: _pw, ...safeUser } = user;
      const token = this.signToken(user.id, user.email ?? null, user.role);
      return { token, user: safeUser };
    } else {
      // Peternak login by farmerId — no password needed
      const user = await this.prisma.user.findUnique({
        where: { farmerId: dto.identifier },
      });

      if (!user) throw new UnauthorizedException('ID Peternak tidak ditemukan');

      const { password: _pw, ...safeUser } = user;
      const token = this.signToken(user.id, null, user.role);
      return { token, user: safeUser };
    }
  }

  async updateMe(
    userId: string,
    dto: UpdateMeDto,
  ): Promise<{
    id: string;
    email: string | null;
    name: string;
    role: string;
    phone: string | null;
    address: string | null;
    farmerId: string | null;
  }> {
    if (dto.email) {
      const existing = await this.prisma.user.findFirst({
        where: { email: dto.email, id: { not: userId } },
      });
      if (existing) throw new ConflictException('Email sudah digunakan');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.address !== undefined && { address: dto.address }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        address: true,
        farmerId: true,
      },
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Hanya admin yang dapat mengubah password');
    }

    if (!user.password) throw new UnauthorizedException('Akun ini tidak memiliki password');

    const valid = await bcrypt.compare(dto.oldPassword, user.password);
    if (!valid) throw new UnauthorizedException('Password lama salah');

    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    return { message: 'Password berhasil diubah' };
  }

  private signToken(userId: string, email: string | null, role: string): string {
    return this.jwt.sign({ sub: userId, email, role });
  }
}
