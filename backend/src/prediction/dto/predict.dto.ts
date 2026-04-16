import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export enum PredictionModel {
  A = 'A',
  B = 'B',
}

export class PredictDto {
  @IsEnum(PredictionModel)
  model: PredictionModel;

  // Model A only: paritas 1-6
  @ValidateIf((o) => o.model === PredictionModel.A)
  @IsInt()
  @Min(1)
  @Max(6)
  parity?: number;

  // Bulan laktasi 2-9
  @IsInt()
  @Min(2)
  @Max(9)
  ll: number;

  // BCS 2-4 (boleh desimal)
  @IsNumber()
  @Min(2)
  @Max(4)
  bcs: number;

  // Model B only: bobot badan 250-700 kg
  @ValidateIf((o) => o.model === PredictionModel.B)
  @IsNumber()
  @Min(250)
  @Max(700)
  weight?: number;
}

export class PredictResponseDto {
  model: PredictionModel;
  result: number;
  unit: string;
  inputs: {
    parity?: number;
    ll: number;
    bcs: number;
    weight?: number;
  };
}
