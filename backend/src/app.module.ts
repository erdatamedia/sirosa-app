import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { PredictionModule } from './prediction/prediction.module';
import { AuthModule } from './auth/auth.module';
import { CowModule } from './cow/cow.module';
import { MilkProductionModule } from './milk-production/milk-production.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    PredictionModule,
    AuthModule,
    CowModule,
    MilkProductionModule,
    DashboardModule,
    UsersModule,
  ],
})
export class AppModule {}
