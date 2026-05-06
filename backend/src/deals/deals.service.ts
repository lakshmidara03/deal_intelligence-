import { HttpService } from '@nestjs/axios';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ActivityType, DealHealth, DriverImpact } from '../../../packages/database/generated/client';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyzeDealDto } from './dto/analyze-deal.dto';
import { CreateActivityDto } from './dto/create-activity.dto';

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

  async findAll(accountId?: string) {
    const account = accountId
      ? await this.prisma.employee.findUnique({ where: { id: accountId }, select: { id: true, role: true } })
      : null;

    return this.prisma.deal.findMany({
      where: account && account.role !== 'ADMIN' ? { employeeId: account.id } : undefined,
      orderBy: { closeDate: 'asc' },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            title: true
          }
        },
        drivers: true,
        insights: { orderBy: { generatedAt: 'desc' }, take: 1 }
      }
    });
  }

  async findOne(id: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            title: true
          }
        },
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

  async createActivity(id: string, dto: CreateActivityDto) {
    await this.ensureDeal(id);

    await this.prisma.activity.create({
      data: {
        dealId: id,
        type: ActivityType.EMAIL,
        title: dto.title,
        summary: dto.summary,
        rawText: dto.rawText,
        occurredAt: new Date(dto.occurredAt)
      }
    });

    return this.findOne(id);
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
          summary: `${analysis.insightSummary} Refreshed at ${new Date().toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata'
          })}.`,
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
    const activityText = deal.activities
      .map((activity) => `${activity.title} ${activity.summary} ${activity.rawText}`)
      .join(' ')
      .toLowerCase();

    const hasCompetitor = activityText.includes('competitor') || activityText.includes('northstar') || activityText.includes('another vendor');
    const hasNextStepMissing = activityText.includes('next step') || activityText.includes('not scheduled');
    const hasPricingConcern = activityText.includes('pricing') || activityText.includes('price') || activityText.includes('discount');
    const hasNoRecentActivity = activityText.includes('no reply') || activityText.includes('no response') || activityText.includes('quiet');
    const hasDecisionMakerMissing = activityText.includes('decision-maker') || activityText.includes('economic buyer');

    const drivers = [
      ...(hasCompetitor
        ? [
            {
              label: 'Competitor Mention',
              description: 'A competitor appears in the recent deal context.',
              impact: DriverImpact.NEGATIVE
            }
          ]
        : []),
      ...(hasNextStepMissing
        ? [
            {
              label: 'Next Step Missing',
              description: 'The next customer action is not clearly scheduled.',
              impact: DriverImpact.NEGATIVE
            }
          ]
        : []),
      ...(hasPricingConcern
        ? [
            {
              label: 'Pricing Concern',
              description: 'Recent activity contains pricing, discount, or budget concern signals.',
              impact: DriverImpact.NEGATIVE
            }
          ]
        : []),
      ...(hasNoRecentActivity
        ? [
            {
              label: 'No Recent Activity',
              description: 'The customer has not responded after a recent touch.',
              impact: DriverImpact.NEGATIVE
            }
          ]
        : []),
      ...(hasDecisionMakerMissing
        ? [
            {
              label: 'Decision-Maker Unknown',
              description: 'The economic buyer or decision owner is not clearly identified.',
              impact: DriverImpact.NEGATIVE
            }
          ]
        : []),
      ...(!hasCompetitor && !hasNextStepMissing && !hasPricingConcern && !hasNoRecentActivity && !hasDecisionMakerMissing
        ? [
            {
              label: 'Positive Engagement',
              description: 'No major risk signal was found in the latest activity context.',
              impact: DriverImpact.POSITIVE
            }
          ]
        : [])
    ];

    const health =
      hasCompetitor || hasNextStepMissing || hasPricingConcern || hasNoRecentActivity || hasDecisionMakerMissing
        ? DealHealth.AT_RISK
        : DealHealth.HEALTHY;

    return {
      health,
      confidence: health === DealHealth.AT_RISK ? 'High' : 'Medium',
      healthExplanation:
        health === DealHealth.AT_RISK
          ? 'The deal needs attention because recent activity contains risk signals.'
          : 'The deal looks healthy based on recent engagement signals.',
      recommendedAction:
        health === DealHealth.AT_RISK
          ? 'Review the risk drivers, follow up with the customer, and confirm the next committed action.'
          : 'Keep momentum by confirming decision criteria and timeline.',
      insightSummary: `${deal.company} was analyzed using ${deal.activities.length} recent activities.`,
      interpretation: 'This analysis reviewed all saved activity text for competitor, pricing, reply, decision-maker, and next-step signals.',
      drivers
    };
  }
}
