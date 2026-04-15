import { IsEnum, IsISO8601, IsNumber, IsString, Max, Min } from 'class-validator';
import { MilkSession } from '@prisma/client';

export class CreateMilkProductionDto {
  @IsString()
  cowId: string;

  @IsISO8601()
  date: string;

  @IsEnum(MilkSession)
  session: MilkSession;

  @IsNumber()
  @Min(0.1)
  @Max(50)
  amount: number;
}
