import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { PredictionService } from './prediction.service';
import { PredictDto } from './dto/predict.dto';

@Controller('prediction')
export class PredictionController {
  constructor(private readonly predictionService: PredictionService) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async predict(@Body() dto: PredictDto) {
    return this.predictionService.predict(dto);
  }

  @Get('history')
  async getHistory(@Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    return this.predictionService.getHistory(parsedLimit);
  }
}
