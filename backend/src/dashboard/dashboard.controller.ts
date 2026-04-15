import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { DashboardService } from './dashboard.service';

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

  @Get('farmer')
  @Roles(Role.FARMER)
  farmerDashboard(@Request() req: AuthRequest) {
    return this.service.farmerDashboard(req.user.id);
  }

  @Get('system-info')
  @Roles(Role.ADMIN)
  systemInfo() {
    return this.service.systemInfo();
  }
}
