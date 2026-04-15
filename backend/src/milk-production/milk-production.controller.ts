import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MilkProductionService } from './milk-production.service';
import { CreateMilkProductionDto } from './dto/create-milk-production.dto';

interface AuthRequest {
  user: { id: string; role: Role };
}

@Controller('milk-production')
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class MilkProductionController {
  constructor(private readonly service: MilkProductionService) {}

  @Post()
  create(@Body() dto: CreateMilkProductionDto, @Request() req: AuthRequest) {
    return this.service.create(dto, req.user);
  }

  @Get('summary')
  summary(
    @Query('cowId') cowId: string,
    @Request() req: AuthRequest,
  ) {
    return this.service.summary(cowId, req.user);
  }

  @Get('evaluate')
  evaluate(
    @Query('cowId') cowId: string,
    @Request() req: AuthRequest,
  ) {
    return this.service.evaluate(cowId, req.user);
  }

  @Get('admin/stats')
  @Roles(Role.ADMIN)
  adminStats(@Query('farmId') farmId?: string) {
    return this.service.adminStats(farmId);
  }

  @Get('admin/trend')
  @Roles(Role.ADMIN)
  adminTrend(@Query('farmId') farmId?: string) {
    return this.service.adminTrend(farmId);
  }

  @Get()
  findAll(
    @Request() req: AuthRequest,
    @Query('cowId') cowId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll(req.user, {
      cowId,
      from,
      to,
      limit: limit ? parseInt(limit, 10) : 30,
    });
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
