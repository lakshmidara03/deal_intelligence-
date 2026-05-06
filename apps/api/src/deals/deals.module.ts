import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DealsController } from './deals.controller';
import { DealsService } from './deals.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [HttpModule],
  controllers: [DealsController],
  providers: [DealsService, PrismaService]
})
export class DealsModule {}
