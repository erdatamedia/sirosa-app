import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMilkProductionDto } from './dto/create-milk-production.dto';

interface RequestUser {
  id: string;
  role: Role;
}

@Injectable()
export class MilkProductionService {
  constructor(private readonly prisma: PrismaService) {}

  // Verify the requesting user has access to the cow
  private async assertCowAccess(cowId: string, user: RequestUser) {
    const cow = await this.prisma.cow.findUnique({
      where: { id: cowId },
      include: { farm: { select: { ownerId: true } } },
    });
    if (!cow) throw new NotFoundException('Sapi tidak ditemukan');
    if (user.role === Role.FARMER && cow.farm.ownerId !== user.id) {
      throw new ForbiddenException('Anda tidak memiliki akses ke sapi ini');
    }
    return cow;
  }

  async create(dto: CreateMilkProductionDto, user: RequestUser) {
    await this.assertCowAccess(dto.cowId, user);

    return this.prisma.milkProduction.create({
      data: {
        cowId: dto.cowId,
        date: new Date(dto.date),
        session: dto.session,
        amount: dto.amount,
        userId: user.id,
      },
      include: {
        cow: { select: { id: true, earTag: true, name: true } },
        recordedBy: { select: { id: true, name: true } },
      },
    });
  }

  async findAll(
    user: RequestUser,
    filters: { cowId?: string; from?: string; to?: string; limit?: number },
  ) {
    const where: Record<string, unknown> = {};

    if (filters.cowId) {
      await this.assertCowAccess(filters.cowId, user);
      where.cowId = filters.cowId;
    } else if (user.role === Role.FARMER) {
      // Limit to farmer's own cows
      const farm = await this.prisma.farm.findUnique({
        where: { ownerId: user.id },
        select: { id: true },
      });
      if (!farm) return [];
      where.cow = { farmId: farm.id };
    }

    if (filters.from || filters.to) {
      const dateFilter: Record<string, Date> = {};
      if (filters.from) dateFilter.gte = new Date(filters.from);
      if (filters.to) {
        const to = new Date(filters.to);
        to.setHours(23, 59, 59, 999);
        dateFilter.lte = to;
      }
      where.date = dateFilter;
    }

    return this.prisma.milkProduction.findMany({
      where,
      take: filters.limit ?? 30,
      orderBy: [{ date: 'desc' }, { session: 'asc' }],
      include: {
        cow: { select: { id: true, earTag: true, name: true } },
        recordedBy: { select: { id: true, name: true } },
      },
    });
  }

  async summary(cowId: string, user: RequestUser) {
    await this.assertCowAccess(cowId, user);

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const records = await this.prisma.milkProduction.findMany({
      where: { cowId, date: { gte: sevenDaysAgo } },
      orderBy: { date: 'asc' },
    });

    // Total today
    const todayTotal = records
      .filter((r) => r.date >= todayStart)
      .reduce((s, r) => s + r.amount, 0);

    // Group by day for trend
    const dayMap = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dayMap.set(key, 0);
    }
    for (const r of records) {
      const key = r.date.toISOString().slice(0, 10);
      dayMap.set(key, (dayMap.get(key) ?? 0) + r.amount);
    }
    const trend = Array.from(dayMap.entries()).map(([date, amount]) => ({
      date,
      amount: Math.round(amount * 100) / 100,
    }));

    const nonZeroDays = trend.filter((t) => t.amount > 0);
    const avg7d =
      nonZeroDays.length > 0
        ? nonZeroDays.reduce((s, t) => s + t.amount, 0) / nonZeroDays.length
        : 0;

    return {
      todayTotal: Math.round(todayTotal * 100) / 100,
      avg7d: Math.round(avg7d * 100) / 100,
      trend,
    };
  }

  async evaluate(cowId: string, user: RequestUser) {
    const cow = await this.assertCowAccess(cowId, user);

    const ll = cow.lactationMonth;
    const bcs = cow.currentBCS;
    const parity = cow.parity;
    const weight = cow.currentWeight;

    // Prediction A — requires parity, ll, bcs
    let predictionA: number | null = null;
    if (ll != null && bcs != null) {
      predictionA =
        12.07588 -
        0.0023511 * parity -
        0.165474 * ll -
        0.0035817 * bcs;
      predictionA = Math.round(predictionA * 1000) / 1000;
    }

    // Prediction B — requires ll, bcs, weight
    let predictionB: number | null = null;
    if (ll != null && bcs != null && weight != null) {
      predictionB =
        14.54375 -
        0.2656174 * ll -
        2.916924 * bcs +
        0.0128959 * weight;
      predictionB = Math.round(predictionB * 1000) / 1000;
    }

    // Actual average last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const records = await this.prisma.milkProduction.findMany({
      where: { cowId, date: { gte: sevenDaysAgo } },
    });

    const dayMap = new Map<string, number>();
    for (const r of records) {
      const key = r.date.toISOString().slice(0, 10);
      dayMap.set(key, (dayMap.get(key) ?? 0) + r.amount);
    }
    const dayTotals = Array.from(dayMap.values());
    const actualAvg =
      dayTotals.length > 0
        ? dayTotals.reduce((s, v) => s + v, 0) / dayTotals.length
        : null;

    const roundedActual =
      actualAvg !== null ? Math.round(actualAvg * 1000) / 1000 : null;

    const selisihA =
      predictionA !== null && roundedActual !== null
        ? Math.round((roundedActual - predictionA) * 1000) / 1000
        : null;
    const selisihB =
      predictionB !== null && roundedActual !== null
        ? Math.round((roundedActual - predictionB) * 1000) / 1000
        : null;

    const percentA =
      predictionA !== null && predictionA > 0 && roundedActual !== null
        ? Math.round(((roundedActual - predictionA) / predictionA) * 1000) / 10
        : null;
    const percentB =
      predictionB !== null && predictionB > 0 && roundedActual !== null
        ? Math.round(((roundedActual - predictionB) / predictionB) * 1000) / 10
        : null;

    let status: 'above' | 'below' | 'normal' | 'insufficient_data' =
      'insufficient_data';
    if (percentA !== null) {
      if (percentA > 10) status = 'above';
      else if (percentA < -10) status = 'below';
      else status = 'normal';
    }

    return {
      cow: { id: cow.id, earTag: cow.earTag, name: cow.name },
      inputs: { parity, ll, bcs, weight },
      predictionA,
      predictionB,
      actualAvg: roundedActual,
      selisihA,
      selisihB,
      percentA,
      percentB,
      status,
    };
  }

  async remove(id: string) {
    const rec = await this.prisma.milkProduction.findUnique({ where: { id } });
    if (!rec) throw new NotFoundException('Data produksi tidak ditemukan');
    return this.prisma.milkProduction.delete({ where: { id } });
  }

  // Admin: aggregate today across all cows (optionally filtered by farmId)
  async adminStats(farmId?: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const where: Record<string, unknown> = { date: { gte: todayStart } };
    if (farmId) where.cow = { farmId };

    const records = await this.prisma.milkProduction.findMany({
      where,
      include: { cow: { select: { id: true, earTag: true } } },
    });

    const totalToday = records.reduce((s, r) => s + r.amount, 0);
    const cowsToday = new Set(records.map((r) => r.cowId)).size;
    const avgPerCow = cowsToday > 0 ? totalToday / cowsToday : 0;

    return {
      totalToday: Math.round(totalToday * 100) / 100,
      cowsToday,
      avgPerCow: Math.round(avgPerCow * 100) / 100,
    };
  }

  // Admin: 7-day trend for area chart (optionally by farmId)
  async adminTrend(farmId?: string) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const where: Record<string, unknown> = { date: { gte: sevenDaysAgo } };
    if (farmId) where.cow = { farmId };

    const records = await this.prisma.milkProduction.findMany({ where });

    const dayMap = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dayMap.set(d.toISOString().slice(0, 10), 0);
    }
    for (const r of records) {
      const key = r.date.toISOString().slice(0, 10);
      dayMap.set(key, (dayMap.get(key) ?? 0) + r.amount);
    }

    return Array.from(dayMap.entries()).map(([date, amount]) => ({
      date,
      amount: Math.round(amount * 100) / 100,
    }));
  }
}
