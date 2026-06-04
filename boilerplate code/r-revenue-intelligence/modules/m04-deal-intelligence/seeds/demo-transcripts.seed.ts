/**
 * Seed script: Insert real CallRecord + Transcript rows linked to HubSpot deal IDs.
 * Run with: npx ts-node modules/m04-deal-intelligence/seeds/demo-transcripts.seed.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/m04?schema=public',
    },
  },
});

const TENANT_ID = 'default';

// Map HubSpot deal IDs to realistic call transcripts with MEDDPICC coverage
const dealTranscripts: Record<string, string[]> = {
  '327698960080': [
    'We need to reduce our cloud infrastructure costs by 30% within the next fiscal year. The CFO Sarah Chen approved a $450K budget and this is a top priority for the Q3 roadmap.',
    'Evaluation criteria include functionality, security compliance, and total cost of ownership. We will score vendors on a weighted matrix.',
    'The decision process involves a pilot phase, then procurement review, then final sign-off from the CFO. Timeline is 8 weeks.',
    'Our current setup is bleeding money — we are over-provisioned and wasting $20K per month. Compliance deadline is end of quarter.',
    'Lisa Park is our internal champion. She is pushing hard for this and selling it to the executive team.',
  ],
  '327698961084': [
    'Budget owner identified — the CFO controls spend and has final approval authority over any deal above $200K.',
    'Evaluation matrix and RFP criteria were shared. They want SOC2 compliance and 99.9% uptime SLA.',
    'Compelling event: compliance deadline is approaching fast. Must solve by end of quarter or face audit risk.',
    'Champion is actively selling internally and promoting our solution to the steering committee.',
  ],
  '327698961097': [
    'We discussed reducing manual data entry by 40% which would save roughly $150K annually in labour costs.',
    'The VP of Operations seems to have budget authority but procurement needs to be involved for final sign-off.',
    'Some requirements were discussed but no formal evaluation criteria established yet. We need to send an RFP.',
    'They are losing deals because their current CRM is too slow. Pain point is clear but no deadline set yet.',
  ],
  '327698961110': [
    'ROI target is 300% within 18 months based on automation savings and faster deal velocity.',
    'CEO and CFO both engaged. The CFO has final budget approval and is driving this initiative.',
    'Decision criteria include integration with Salesforce, API availability, and customer support quality.',
    'Process: pilot with 5 reps, then rollout to 50. Legal review required for contracts over $500K.',
    'Pain is acute — current tool crashes during demos and reps are frustrated. Losing $50K per quarter.',
    'Michael Rodriguez is the champion and has already convinced two VPs to back this purchase.',
  ],
};

async function seed() {
  console.log('Seeding CallRecord + Transcript data for M04...\n');

  for (const [dealId, texts] of Object.entries(dealTranscripts)) {
    // Create a call record for each transcript text (1 call per text)
    for (let idx = 0; idx < texts.length; idx++) {
      const callId = `call-${dealId}-${idx}`;

      const existing = await prisma.callRecord.findUnique({ where: { id: callId } });
      if (existing) {
        console.log(`  Skip existing call ${callId}`);
        continue;
      }

      const call = await prisma.callRecord.create({
        data: {
          id: callId,
          tenantId: TENANT_ID,
          title: `Call ${idx + 1} for deal ${dealId}`,
          callDate: new Date(Date.now() - idx * 86400000 * 2), // spaced 2 days apart
          durationSeconds: 900 + idx * 300,
          callType: 'meeting',
          callSource: 'zoom',
          participants: ['Sales Rep', 'Customer'],
          callOwner: 'sales-rep-1',
          opportunityId: dealId,
          transcriptStatus: 'completed',
        },
      });

      await prisma.transcript.create({
        data: {
          tenantId: TENANT_ID,
          callId: call.id,
          fullText: texts[idx],
          language: 'en',
          wordCount: texts[idx].split(/\s+/).length,
          speakerCount: 2,
        },
      });

      console.log(`  Created call ${callId} + transcript for deal ${dealId}`);
    }
  }

  console.log('\nDone! The m04 controller will now find real transcripts in the DB.');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
