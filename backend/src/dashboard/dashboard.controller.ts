import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { DashboardService, type TrendPeriod } from './dashboard.service';

interface AuthRequest {
  user: { id: string; role: Role };
}

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('admin')
  @Roles(Role.ADMIN)
  adminDashboard() {
    return this.service.adminDashboard();
  }

  @Get('admin/trend')
  @Roles(Role.ADMIN)
  adminTrend(
    @Query('period') period?: TrendPeriod,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.adminTrend(period ?? '7d', from, to);
  }

  @Get('farmer')
  @Roles(Role.FARMER)
  farmerDashboard(@Request() req: AuthRequest) {
    return this.service.farmerDashboard(req.user.id);
  }

  @Get('farmer/trend')
  @Roles(Role.FARMER)
  farmerTrend(
    @Request() req: AuthRequest,
    @Query('period') period?: TrendPeriod,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.farmerTrend(req.user.id, period ?? '7d', from, to);
  }

  @Get('system-info')
  @Roles(Role.ADMIN)
  systemInfo() {
    return this.service.systemInfo();
  }
}
