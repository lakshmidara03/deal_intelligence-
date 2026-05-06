import { config } from 'dotenv';
import { AccountRole, ActivityType, DealHealth, DealStage, DriverImpact, PrismaClient } from '../generated/client';

config({ path: '../../.env' });
config({ path: '../backend/.env' });
config({ path: '.env' });

const prisma = new PrismaClient();

type SeedDeal = {
  name: string;
  company: string;
  owner: string;
  employeeEmail: string;
  value: number;
  stage: DealStage;
  closeDate: string;
  health: DealHealth;
  confidence: string;
  healthExplanation: string;
  recommendedAction: string;
  activities: Array<{
    type: ActivityType;
    title: string;
    summary: string;
    rawText: string;
    occurredAt: string;
  }>;
  drivers: Array<{
    label: string;
    description: string;
    impact: DriverImpact;
  }>;
  insight: {
    summary: string;
    interpretation: string;
  };
};

const employees = [
  {
    name: 'Admin Manager',
    email: 'admin@dealpoc.com',
    password: 'admin123',
    role: AccountRole.ADMIN,
    title: 'Sales Manager'
  },
  {
    name: 'Priya Raman',
    email: 'priya@dealpoc.com',
    password: 'employee123',
    role: AccountRole.EMPLOYEE,
    title: 'Senior Account Executive'
  },
  {
    name: 'Arjun Mehta',
    email: 'arjun@dealpoc.com',
    password: 'employee123',
    role: AccountRole.EMPLOYEE,
    title: 'Account Executive'
  },
  {
    name: 'Maya Iyer',
    email: 'maya@dealpoc.com',
    password: 'employee123',
    role: AccountRole.EMPLOYEE,
    title: 'Account Executive'
  }
];

const deals: SeedDeal[] = [
  {
    name: 'Enterprise Analytics Expansion',
    company: 'Acme Manufacturing',
    owner: 'Priya Raman',
    employeeEmail: 'priya@dealpoc.com',
    value: 85000,
    stage: DealStage.AT_RISK,
    closeDate: '2026-06-15',
    health: DealHealth.AT_RISK,
    confidence: 'High',
    healthExplanation: 'The deal has gone quiet, a competitor was mentioned, and the next step is not confirmed.',
    recommendedAction: 'Schedule a decision timeline call with the economic buyer and confirm the procurement owner.',
    activities: [
      {
        type: ActivityType.CALL,
        title: 'Discovery follow-up call',
        summary: 'Buyer confirmed budget but asked for competitor comparison.',
        rawText:
          'The buyer said budget is approved, but they are also reviewing Northstar BI. They asked for a clearer comparison before moving forward.',
        occurredAt: '2026-04-18T10:30:00Z'
      },
      {
        type: ActivityType.EMAIL,
        title: 'Pricing packet sent',
        summary: 'Pricing and implementation details were shared.',
        rawText: 'Sent pricing packet and onboarding timeline. No reply has been received yet.',
        occurredAt: '2026-04-22T13:00:00Z'
      },
      {
        type: ActivityType.NOTE,
        title: 'Next step missing',
        summary: 'No confirmed meeting date after pricing packet.',
        rawText: 'Account owner noted that the next step is not scheduled and procurement process is unclear.',
        occurredAt: '2026-04-27T09:00:00Z'
      }
    ],
    drivers: [
      {
        label: 'No Recent Activity',
        description: 'No customer response after pricing was sent.',
        impact: DriverImpact.NEGATIVE
      },
      {
        label: 'Competitor Mention',
        description: 'Northstar BI is being evaluated by the buyer.',
        impact: DriverImpact.NEGATIVE
      },
      {
        label: 'Budget Confirmed',
        description: 'Buyer confirmed that budget exists for this initiative.',
        impact: DriverImpact.POSITIVE
      },
      {
        label: 'Next Step Missing',
        description: 'No follow-up meeting is currently scheduled.',
        impact: DriverImpact.NEGATIVE
      }
    ],
    insight: {
      summary: 'Acme is at risk because activity has stalled after pricing and the buyer is comparing competitors.',
      interpretation:
        'The strongest positive signal is confirmed budget. The biggest risk is lack of a scheduled next step after competitor discussion.'
    }
  },
  {
    name: 'Field Service Modernization',
    company: 'Delta Utilities',
    owner: 'Priya Raman',
    employeeEmail: 'priya@dealpoc.com',
    value: 96000,
    stage: DealStage.NEGOTIATION,
    closeDate: '2026-06-30',
    health: DealHealth.HEALTHY,
    confidence: 'High',
    healthExplanation: 'The buyer has executive support and procurement has started.',
    recommendedAction: 'Send final security responses and confirm procurement timeline.',
    activities: [
      {
        type: ActivityType.MEETING,
        title: 'Executive sponsor meeting',
        summary: 'CIO confirmed the rollout is a priority.',
        rawText: 'The CIO confirmed executive support and asked procurement to begin vendor onboarding.',
        occurredAt: '2026-05-03T10:00:00Z'
      },
      {
        type: ActivityType.EMAIL,
        title: 'Security questionnaire received',
        summary: 'Procurement sent security review questions.',
        rawText: 'Procurement sent the security questionnaire and requested final responses this week.',
        occurredAt: '2026-05-04T08:00:00Z'
      }
    ],
    drivers: [
      {
        label: 'Positive Engagement',
        description: 'Executive sponsor and procurement are both active.',
        impact: DriverImpact.POSITIVE
      },
      {
        label: 'Next Meeting Scheduled',
        description: 'Procurement follow-up is already in motion.',
        impact: DriverImpact.POSITIVE
      }
    ],
    insight: {
      summary: 'Delta is healthy because procurement and executive sponsorship are active.',
      interpretation: 'The deal has strong buying intent and clear next steps.'
    }
  },
  {
    name: 'Revenue Operations Rollout',
    company: 'Nimbus Retail',
    owner: 'Arjun Mehta',
    employeeEmail: 'arjun@dealpoc.com',
    value: 42000,
    stage: DealStage.PROPOSAL,
    closeDate: '2026-05-28',
    health: DealHealth.HEALTHY,
    confidence: 'Medium',
    healthExplanation: 'Recent stakeholder engagement is positive and the next meeting is scheduled.',
    recommendedAction: 'Prepare implementation plan before the stakeholder review.',
    activities: [
      {
        type: ActivityType.MEETING,
        title: 'Stakeholder review scheduled',
        summary: 'Customer invited finance and operations leaders to the proposal review.',
        rawText: 'The buyer confirmed a stakeholder review next Tuesday with finance and operations leaders.',
        occurredAt: '2026-05-01T11:00:00Z'
      },
      {
        type: ActivityType.EMAIL,
        title: 'Implementation plan requested',
        summary: 'Buyer asked for timeline and rollout ownership details.',
        rawText:
          'Please send the implementation plan before the stakeholder review. We want to confirm timeline and ownership.',
        occurredAt: '2026-05-02T08:15:00Z'
      }
    ],
    drivers: [
      {
        label: 'Positive Engagement',
        description: 'Multiple stakeholders are joining the next review.',
        impact: DriverImpact.POSITIVE
      },
      {
        label: 'Next Meeting Scheduled',
        description: 'A clear next step is already on the calendar.',
        impact: DriverImpact.POSITIVE
      }
    ],
    insight: {
      summary: 'Nimbus has strong momentum because the buyer scheduled a stakeholder review.',
      interpretation: 'The activity shows positive engagement and clear next-step ownership.'
    }
  },
  {
    name: 'Partner Portal Refresh',
    company: 'Orchid Foods',
    owner: 'Arjun Mehta',
    employeeEmail: 'arjun@dealpoc.com',
    value: 27000,
    stage: DealStage.AT_RISK,
    closeDate: '2026-06-10',
    health: DealHealth.AT_RISK,
    confidence: 'Medium',
    healthExplanation: 'The buyer asked for a discount and has not replied after pricing follow-up.',
    recommendedAction: 'Clarify price objection and confirm whether the portal project is still active.',
    activities: [
      {
        type: ActivityType.CALL,
        title: 'Pricing concern raised',
        summary: 'Buyer asked whether a lower pilot price is available.',
        rawText: 'The buyer said the price may be difficult for this quarter and asked for discount options.',
        occurredAt: '2026-04-25T14:00:00Z'
      },
      {
        type: ActivityType.EMAIL,
        title: 'Discount options sent',
        summary: 'Follow-up pricing options were sent with no reply yet.',
        rawText: 'Sent discount options and pilot scope. No reply has been received yet.',
        occurredAt: '2026-04-29T09:20:00Z'
      }
    ],
    drivers: [
      {
        label: 'Pricing Concern',
        description: 'The buyer raised price sensitivity.',
        impact: DriverImpact.NEGATIVE
      },
      {
        label: 'No Recent Activity',
        description: 'There has been no response after discount options were sent.',
        impact: DriverImpact.NEGATIVE
      }
    ],
    insight: {
      summary: 'Orchid is at risk because pricing concerns are unresolved and the buyer has gone quiet.',
      interpretation: 'The deal needs a direct commercial follow-up.'
    }
  },
  {
    name: 'Support Automation Pilot',
    company: 'Vertex Health',
    owner: 'Maya Iyer',
    employeeEmail: 'maya@dealpoc.com',
    value: 30000,
    stage: DealStage.DISCOVERY,
    closeDate: '2026-07-05',
    health: DealHealth.NEEDS_REVIEW,
    confidence: 'Low',
    healthExplanation: 'Discovery is early and decision criteria are not fully known.',
    recommendedAction: 'Identify the decision-maker and define pilot success criteria.',
    activities: [
      {
        type: ActivityType.CALL,
        title: 'Initial discovery call',
        summary: 'Team discussed support volume and pilot goals.',
        rawText: 'The team wants to reduce ticket handling time, but the decision-maker has not been identified yet.',
        occurredAt: '2026-04-29T15:30:00Z'
      },
      {
        type: ActivityType.NOTE,
        title: 'Decision criteria unclear',
        summary: 'Success criteria for the pilot are still open.',
        rawText: 'Owner needs to confirm success metrics, technical owner, and next step with the customer.',
        occurredAt: '2026-05-01T12:45:00Z'
      }
    ],
    drivers: [
      {
        label: 'Decision-Maker Unknown',
        description: 'The economic buyer has not been identified.',
        impact: DriverImpact.NEGATIVE
      },
      {
        label: 'Pilot Interest',
        description: 'The customer has a clear support automation problem.',
        impact: DriverImpact.POSITIVE
      }
    ],
    insight: {
      summary: 'Vertex needs review because discovery has useful pain signals but incomplete decision criteria.',
      interpretation: 'The activity shows early interest, but the next step and owner need confirmation.'
    }
  },
  {
    name: 'Claims Workflow Upgrade',
    company: 'Aster Insurance',
    owner: 'Maya Iyer',
    employeeEmail: 'maya@dealpoc.com',
    value: 64000,
    stage: DealStage.PROPOSAL,
    closeDate: '2026-07-20',
    health: DealHealth.NEEDS_REVIEW,
    confidence: 'Medium',
    healthExplanation: 'The business team is interested, but technical approval is not confirmed.',
    recommendedAction: 'Confirm the technical owner and ask for security review timing.',
    activities: [
      {
        type: ActivityType.MEETING,
        title: 'Business workshop',
        summary: 'Claims leadership agreed the workflow gap is important.',
        rawText: 'Claims leadership confirmed the workflow issue, but the technical owner has not joined yet.',
        occurredAt: '2026-05-02T13:10:00Z'
      },
      {
        type: ActivityType.NOTE,
        title: 'Technical owner missing',
        summary: 'Security and integration review still need an owner.',
        rawText: 'Need to identify technical owner before proposal can move to approval.',
        occurredAt: '2026-05-03T16:20:00Z'
      }
    ],
    drivers: [
      {
        label: 'Decision-Maker Unknown',
        description: 'Technical approval owner is not yet confirmed.',
        impact: DriverImpact.NEGATIVE
      },
      {
        label: 'Positive Engagement',
        description: 'Business leadership agrees there is a real workflow problem.',
        impact: DriverImpact.POSITIVE
      }
    ],
    insight: {
      summary: 'Aster needs review because business value is clear but technical approval is open.',
      interpretation: 'The next step should focus on technical ownership and approval path.'
    }
  }
];

async function main() {
  await prisma.dealInsight.deleteMany();
  await prisma.dealDriver.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.employee.deleteMany();

  const employeeRecords = await Promise.all(
    employees.map((employee) =>
      prisma.employee.create({
        data: employee
      })
    )
  );
  const employeeByEmail = new Map(employeeRecords.map((employee) => [employee.email, employee]));

  for (const deal of deals) {
    const employee = employeeByEmail.get(deal.employeeEmail);

    await prisma.deal.create({
      data: {
        name: deal.name,
        company: deal.company,
        owner: deal.owner,
        employeeId: employee?.id,
        value: deal.value,
        stage: deal.stage,
        closeDate: new Date(deal.closeDate),
        health: deal.health,
        confidence: deal.confidence,
        healthExplanation: deal.healthExplanation,
        recommendedAction: deal.recommendedAction,
        activities: {
          create: deal.activities.map((activity) => ({
            ...activity,
            occurredAt: new Date(activity.occurredAt)
          }))
        },
        drivers: {
          create: deal.drivers
        },
        insights: {
          create: deal.insight
        }
      }
    });
  }

  console.log(`Seeded ${employees.length} accounts and ${deals.length} deals.`);
  console.log('Demo admin: admin@dealpoc.com / admin123');
  console.log('Demo employee: priya@dealpoc.com / employee123');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
