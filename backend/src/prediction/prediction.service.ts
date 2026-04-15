import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PredictDto, PredictionModel, PredictResponseDto } from './dto/predict.dto';

@Injectable()
export class PredictionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Model A (Tanpa Bobot Badan):
   * Milk_prod = 12.07588 - 0.0023511*parity - 0.165474*ll - 0.0035817*bcs
   */
  private calculateModelA(parity: number, ll: number, bcs: number): number {
    const result = 12.07588 - 0.0023511 * parity - 0.165474 * ll - 0.0035817 * bcs;
    return Math.round(result * 1000) / 1000;
  }

  /**
   * Model B (Dengan Bobot Badan):
   * Milk_prod = 14.54375 - 0.2656174*ll - 2.916924*bcs + 0.0128959*weight
   */
  private calculateModelB(ll: number, bcs: number, weight: number): number {
    const result = 14.54375 - 0.2656174 * ll - 2.916924 * bcs + 0.0128959 * weight;
    return Math.round(result * 1000) / 1000;
  }

  async predict(dto: PredictDto): Promise<PredictResponseDto> {
    let result: number;

    if (dto.model === PredictionModel.A) {
      result = this.calculateModelA(dto.parity!, dto.ll, dto.bcs);
    } else {
      result = this.calculateModelB(dto.ll, dto.bcs, dto.weight!);
    }

    await this.prisma.predictionHistory.create({
      data: {
        model: dto.model,
        parity: dto.parity ?? null,
        ll: dto.ll,
        bcs: dto.bcs,
        weight: dto.weight ?? null,
        result,
      },
    });

    return {
      model: dto.model,
      result,
      unit: 'liter/hari',
      inputs: {
        parity: dto.parity,
        ll: dto.ll,
        bcs: dto.bcs,
        weight: dto.weight,
      },
    };
  }

  async getHistory(limit = 10) {
    return this.prisma.predictionHistory.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
