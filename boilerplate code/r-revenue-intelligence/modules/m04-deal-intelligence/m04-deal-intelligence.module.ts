import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../m01-capture-transcription/database/prisma.module';
import { DealsController } from './controllers/deals.controller';
import { HubSpotService } from './services/hubspot.service';
import { DealsService } from './services/deals.service';
import { DealMeddpiccService } from './services/deal-meddpicc.service';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [DealsController],
  providers: [HubSpotService, DealsService, DealMeddpiccService],
  exports: [HubSpotService, DealsService, DealMeddpiccService],
})
export class M04DealIntelligenceModule {}
