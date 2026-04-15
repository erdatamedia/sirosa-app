import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  Min,
  Max,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { CowStatus } from '@prisma/client';

export class UpdateCowDto {
  @IsOptional()
  @IsString()
  earTag?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(6)
  parity?: number;

  @IsOptional()
  @IsNumber()
  @Min(200)
  @Max(800)
  currentWeight?: number;

  @IsOptional()
  @IsNumber()
  @Min(2)
  @Max(4)
  currentBCS?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  lactationMonth?: number;

  @IsOptional()
  @IsEnum(CowStatus)
  status?: CowStatus;
}
