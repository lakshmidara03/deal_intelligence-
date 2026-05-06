import { HttpService } from '@nestjs/axios';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DealHealth, DriverImpact } from '../../../../packages/database/generated/client';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyzeDealDto } from './dto/analyze-deal.dto';

type AiAnalysis = {
  health: DealHealth;
  confidence: string;
  healthExplanation: string;
  recommendedAction: string;
  insightSummary: string;
  interpretation: string;
  drivers: Array<{
    label: string;
    description: string;
    impact: DriverImpact;
  }>;
};

@Injectable()
export class DealsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly http: HttpService,
    private readonly config: ConfigService
  ) {}

  findAll() {
    return this.prisma.deal.findMany({
      orderBy: { closeDate: 'asc' },
      include: {
        drivers: true,
        insights: { orderBy: { generatedAt: 'desc' }, take: 1 }
      }
    });
  }

  async findOne(id: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
      include: {
        activities: { orderBy: { occurredAt: 'desc' } },
        drivers: true,
        insights: { orderBy: { generatedAt: 'desc' }, take: 1 }
      }
    });

    if (!deal) {
      throw new NotFoundException(`Deal ${id} was not found`);
    }

    return deal;
  }

  async findActivities(id: string) {
    await this.ensureDeal(id);
    return this.prisma.activity.findMany({
      where: { dealId: id },
      orderBy: { occurredAt: 'desc' }
    });
  }

  async findInsights(id: string) {
    await this.ensureDeal(id);
    return this.prisma.dealInsight.findMany({
      where: { dealId: id },
      orderBy: { generatedAt: 'desc' }
    });
  }

  async analyze(id: string, _dto: AnalyzeDealDto) {
    const deal = await this.findOne(id);
    const analysis = await this.getAiAnalysis(deal);

    await this.prisma.$transaction([
      this.prisma.deal.update({
        where: { id },
        data: {
          health: analysis.health,
          confidence: analysis.confidence,
          healthExplanation: analysis.healthExplanation,
          recommendedAction: analysis.recommendedAction
        }
      }),
      this.prisma.dealDriver.deleteMany({ where: { dealId: id } }),
      this.prisma.dealInsight.create({
        data: {
          dealId: id,
          summary: analysis.insightSummary,
          interpretation: analysis.interpretation
        }
      })
    ]);

    await this.prisma.dealDriver.createMany({
      data: analysis.drivers.map((driver) => ({ ...driver, dealId: id }))
    });

    return this.findOne(id);
  }

  private async ensureDeal(id: string) {
    const deal = await this.prisma.deal.findUnique({ where: { id }, select: { id: true } });
    if (!deal) {
      throw new NotFoundException(`Deal ${id} was not found`);
    }
  }

  private async getAiAnalysis(deal: Awaited<ReturnType<DealsService['findOne']>>): Promise<AiAnalysis> {
    const aiServiceUrl = this.config.get<string>('AI_SERVICE_URL');

    if (aiServiceUrl) {
      try {
        const response = await firstValueFrom(
          this.http.post<AiAnalysis>(`${aiServiceUrl}/analyze-deal`, deal, { timeout: 10000 })
        );
        return response.data;
      } catch {
        return this.fallbackAnalysis(deal);
      }
    }

    return this.fallbackAnalysis(deal);
  }

  private fallbackAnalysis(deal: Awaited<ReturnType<DealsService['findOne']>>): AiAnalysis {
    const hasCompetitor = deal.activities.some((activity) =>
      activity.rawText.toLowerCase().includes('competitor') || activity.rawText.toLowerCase().includes('northstar')
    );
    const hasNextStepMissing = deal.activities.some((activity) => activity.rawText.toLowerCase().includes('next step'));

    const drivers = [
      {
        label: 'Activity Reviewed',
        description: `${deal.activities.length} recent interactions were reviewed for risk signals.`,
        impact: DriverImpact.NEUTRAL
      },
      {
        label: hasCompetitor ? 'Competitor Mention' : 'No Competitor Signal',
        description: hasCompetitor ? 'A competitor appears in the recent deal context.' : 'No direct competitor risk was found.',
        impact: hasCompetitor ? DriverImpact.NEGATIVE : DriverImpact.POSITIVE
      },
      {
        label: hasNextStepMissing ? 'Next Step Missing' : 'Next Step Present',
        description: hasNextStepMissing ? 'The next customer action is not clearly scheduled.' : 'The activity context includes a clear next step.',
        impact: hasNextStepMissing ? DriverImpact.NEGATIVE : DriverImpact.POSITIVE
      }
    ];

    const health = hasCompetitor || hasNextStepMissing ? DealHealth.AT_RISK : DealHealth.HEALTHY;

    return {
      health,
      confidence: hasCompetitor || hasNextStepMissing ? 'High' : 'Medium',
      healthExplanation:
        health === DealHealth.AT_RISK
          ? 'The deal needs attention because recent activity contains risk signals.'
          : 'The deal looks healthy based on recent engagement signals.',
      recommendedAction:
        health === DealHealth.AT_RISK
          ? 'Confirm the next meeting and address the main buyer concern before the deal stalls.'
          : 'Keep momentum by confirming decision criteria and timeline.',
      insightSummary: `${deal.company} was analyzed using ${deal.activities.length} recent activities.`,
      interpretation: 'This fallback analysis uses simple keyword and activity checks when the AI service is unavailable.',
      drivers
    };
  }
}
