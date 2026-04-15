import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

function modelA(parity: number, ll: number, bcs: number): number {
  return 12.07588 - 0.0023511 * parity - 0.165474 * ll - 0.0035817 * bcs;
}

function dayRange(daysAgo: number): { gte: Date; lte?: Date } {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(0, 0, 0, 0);
  return { gte: d };
}

function buildTrend(
  records: { date: Date; amount: number }[],
): { date: string; total: number }[] {
  const map = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    map.set(d.toISOString().slice(0, 10), 0);
  }
  for (const r of records) {
    const key = r.date.toISOString().slice(0, 10);
    if (map.has(key)) map.set(key, (map.get(key) ?? 0) + r.amount);
  }
  return Array.from(map.entries()).map(([date, total]) => ({
    date,
    total: Math.round(total * 100) / 100,
  }));
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async adminDashboard() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // ── Basic counts ─────────────────────────────────────────────────────────
    const [totalCows, totalFarms, totalFarmers] = await Promise.all([
      this.prisma.cow.count({ where: { status: 'ACTIVE' } }),
      this.prisma.farm.count(),
      this.prisma.user.count({ where: { role: Role.FARMER } }),
    ]);

    // ── Today production ─────────────────────────────────────────────────────
    const todayRecords = await this.prisma.milkProduction.findMany({
      where: { date: { gte: todayStart } },
      select: { amount: true, cowId: true },
    });
    const todayProduction = todayRecords.reduce((s, r) => s + r.amount, 0);
    const cowsRecordedToday = new Set(todayRecords.map((r) => r.cowId)).size;
    const avgProductionPerCow =
      cowsRecordedToday > 0 ? todayProduction / cowsRecordedToday : 0;

    // ── 7-day trend ───────────────────────────────────────────────────────────
    const weekRecords = await this.prisma.milkProduction.findMany({
      where: { date: dayRange(6) },
      select: { date: true, amount: true },
    });
    const productionTrend = buildTrend(weekRecords);

    // ── Top 5 cows (7-day avg) ────────────────────────────────────────────────
    const weekFull = await this.prisma.milkProduction.findMany({
      where: { date: dayRange(6) },
      select: { cowId: true, amount: true, date: true },
    });
    // Group by cow + day, then average across days
    const cowDayMap = new Map<string, Map<string, number>>();
    for (const r of weekFull) {
      const dayKey = r.date.toISOString().slice(0, 10);
      if (!cowDayMap.has(r.cowId)) cowDayMap.set(r.cowId, new Map());
      const dm = cowDayMap.get(r.cowId)!;
      dm.set(dayKey, (dm.get(dayKey) ?? 0) + r.amount);
    }
    const cowAvgs: { cowId: string; avg: number }[] = [];
    for (const [cowId, dm] of cowDayMap.entries()) {
      const vals = Array.from(dm.values());
      cowAvgs.push({ cowId, avg: vals.reduce((s, v) => s + v, 0) / vals.length });
    }
    cowAvgs.sort((a, b) => b.avg - a.avg);
    const top5Ids = cowAvgs.slice(0, 5).map((c) => c.cowId);
    const top5Cows = await this.prisma.cow.findMany({
      where: { id: { in: top5Ids } },
      select: { id: true, earTag: true, name: true, farm: { select: { name: true } } },
    });
    const topCows = cowAvgs.slice(0, 5).map((c) => {
      const cow = top5Cows.find((t) => t.id === c.cowId);
      return {
        earTag: cow?.earTag ?? '',
        name: cow?.name ?? null,
        farmName: cow?.farm.name ?? '',
        avgProduction: Math.round(c.avg * 100) / 100,
      };
    });

    // ── Alert cows: actual < prediction - 20% ────────────────────────────────
    const activeCows = await this.prisma.cow.findMany({
      where: { status: 'ACTIVE', currentBCS: { not: null }, lactationMonth: { not: null } },
      select: {
        id: true,
        earTag: true,
        name: true,
        parity: true,
        lactationMonth: true,
        currentBCS: true,
        farm: { select: { name: true } },
      },
    });

    const alertCows: {
      earTag: string;
      name: string | null;
      farmName: string;
      actual: number;
      predicted: number;
      percent: number;
    }[] = [];

    if (activeCows.length > 0) {
      const allCowIds = activeCows.map((c) => c.id);
      const alertWeekRecords = await this.prisma.milkProduction.findMany({
        where: { cowId: { in: allCowIds }, date: dayRange(6) },
        select: { cowId: true, amount: true, date: true },
      });

      // Build day-avg per cow
      const alertDayMap = new Map<string, Map<string, number>>();
      for (const r of alertWeekRecords) {
        const dk = r.date.toISOString().slice(0, 10);
        if (!alertDayMap.has(r.cowId)) alertDayMap.set(r.cowId, new Map());
        const dm = alertDayMap.get(r.cowId)!;
        dm.set(dk, (dm.get(dk) ?? 0) + r.amount);
      }

      for (const cow of activeCows) {
        if (cow.lactationMonth == null || cow.currentBCS == null) continue;
        const predicted = modelA(cow.parity, cow.lactationMonth, cow.currentBCS);
        const dm = alertDayMap.get(cow.id);
        if (!dm || dm.size === 0) continue;
        const dayVals = Array.from(dm.values());
        const actual = dayVals.reduce((s, v) => s + v, 0) / dayVals.length;
        const percent = ((actual - predicted) / predicted) * 100;
        if (percent < -20) {
          alertCows.push({
            earTag: cow.earTag,
            name: cow.name,
            farmName: cow.farm.name,
            actual: Math.round(actual * 100) / 100,
            predicted: Math.round(predicted * 100) / 100,
            percent: Math.round(percent * 10) / 10,
          });
        }
      }
      alertCows.sort((a, b) => a.percent - b.percent);
    }

    return {
      totalCows,
      totalFarms,
      totalFarmers,
      todayProduction: Math.round(todayProduction * 100) / 100,
      avgProductionPerCow: Math.round(avgProductionPerCow * 100) / 100,
      cowsRecordedToday,
      productionTrend,
      topCows,
      alertCows,
    };
  }

  async systemInfo() {
    const [totalUsers, totalCows, totalMilkRecords] = await Promise.all([
      this.prisma.user.count({ where: { role: Role.FARMER } }),
      this.prisma.cow.count(),
      this.prisma.milkProduction.count(),
    ]);
    return {
      version: 'SIROSA v1.0.0',
      totalUsers,
      totalCows,
      totalMilkRecords,
    };
  }

  async farmerDashboard(userId: string) {
    // Get farmer's farm
    const farm = await this.prisma.farm.findUnique({
      where: { ownerId: userId },
      select: { id: true, name: true },
    });

    if (!farm) {
      return {
        farmName: null,
        totalCows: 0,
        todayProduction: 0,
        avgProductionPerCow: 0,
        cowsRecordedToday: 0,
        totalActiveCows: 0,
        productionTrend: [],
        topCows: [],
        lowCows: [],
      };
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Active cows in this farm
    const [activeCows] = await Promise.all([
      this.prisma.cow.findMany({
        where: { farmId: farm.id, status: 'ACTIVE' },
        select: { id: true, earTag: true, name: true },
      }),
    ]);
    const totalCows = activeCows.length;
    const activeCowIds = activeCows.map((c) => c.id);

    // Today production
    const todayRecs = await this.prisma.milkProduction.findMany({
      where: { cowId: { in: activeCowIds }, date: { gte: todayStart } },
      select: { amount: true, cowId: true },
    });
    const todayProduction = todayRecs.reduce((s, r) => s + r.amount, 0);
    const cowsRecordedToday = new Set(todayRecs.map((r) => r.cowId)).size;
    const avgProductionPerCow =
      cowsRecordedToday > 0 ? todayProduction / cowsRecordedToday : 0;

    // 7-day trend
    const weekRecs = await this.prisma.milkProduction.findMany({
      where: { cowId: { in: activeCowIds }, date: dayRange(6) },
      select: { date: true, amount: true, cowId: true },
    });
    const productionTrend = buildTrend(weekRecs);

    // Top / low cows by 7-day avg
    const cowDayMap = new Map<string, Map<string, number>>();
    for (const r of weekRecs) {
      const dk = r.date.toISOString().slice(0, 10);
      if (!cowDayMap.has(r.cowId)) cowDayMap.set(r.cowId, new Map());
      const dm = cowDayMap.get(r.cowId)!;
      dm.set(dk, (dm.get(dk) ?? 0) + r.amount);
    }
    const cowAvgs: { cowId: string; avg: number }[] = [];
    for (const [cowId, dm] of cowDayMap.entries()) {
      const vals = Array.from(dm.values());
      cowAvgs.push({ cowId, avg: vals.reduce((s, v) => s + v, 0) / vals.length });
    }
    cowAvgs.sort((a, b) => b.avg - a.avg);

    const mapCow = (c: { cowId: string; avg: number }) => {
      const cow = activeCows.find((a) => a.id === c.cowId);
      return {
        earTag: cow?.earTag ?? '',
        name: cow?.name ?? null,
        avgProduction: Math.round(c.avg * 100) / 100,
      };
    };

    const topCows = cowAvgs.slice(0, 3).map(mapCow);
    const lowCows = [...cowAvgs].reverse().slice(0, 3).map(mapCow);

    return {
      farmName: farm.name,
      totalCows,
      totalActiveCows: totalCows,
      todayProduction: Math.round(todayProduction * 100) / 100,
      avgProductionPerCow: Math.round(avgProductionPerCow * 100) / 100,
      cowsRecordedToday,
      productionTrend,
      topCows,
      lowCows,
    };
  }
}
