import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import { CowService } from './cow.service';
import { CreateCowDto } from './dto/create-cow.dto';
import { UpdateCowDto } from './dto/update-cow.dto';

interface AuthRequest {
  user: { id: string; role: Role };
}

@Controller('cows')
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class CowController {
  constructor(private readonly cowService: CowService) {}

  @Post()
  create(@Body() dto: CreateCowDto, @Request() req: AuthRequest) {
    return this.cowService.create(dto, req.user);
  }

  @Get()
  findAll(
    @Request() req: AuthRequest,
    @Query('farmId') farmId?: string,
    @Query('status') status?: string,
  ) {
    return this.cowService.findAll(req.user, { farmId, status });
  }

  @Get('farms/all')
  @Roles(Role.ADMIN)
  listFarms() {
    return this.cowService.listFarms();
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.cowService.findOne(id, req.user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCowDto,
    @Request() req: AuthRequest,
  ) {
    return this.cowService.update(id, dto, req.user);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.cowService.remove(id);
  }
}
