import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { DealsModule } from './deals/deals.module';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/api/.env', '.env', 'packages/database/.env']
    }),
    HttpModule,
    DealsModule
  ],
  providers: [PrismaService]
})
export class AppModule {}
