import { Module } from '@nestjs/common';
import { CowController } from './cow.controller';
import { CowService } from './cow.service';

@Module({
  controllers: [CowController],
  providers: [CowService],
})
export class CowModule {}
