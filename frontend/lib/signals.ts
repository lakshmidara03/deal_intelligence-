import type { Activity, DealDriver } from './types';

export const riskCategories = [
  'ALL',
  'HEALTHY',
  'AT_RISK',
  'NEEDS_REVIEW',
  'No Recent Activity',
  'Competitor Mention',
  'Next Step Missing',
  'Pricing Concern',
  'Decision-Maker Unknown',
  'Positive Engagement'
] as const;

export type RiskCategory = (typeof riskCategories)[number];

export function inferActivitySignal(activity: Activity) {
  const text = `${activity.title} ${activity.summary} ${activity.rawText}`.toLowerCase();

  if (text.includes('northstar') || text.includes('competitor') || text.includes('another vendor')) {
    return {
      category: 'Competitor Mention',
      meaning: 'The buyer is comparing another option, so this activity creates competitive risk.'
    };
  }

  if (text.includes('no reply') || text.includes('no response') || text.includes('quiet') || text.includes('stalled')) {
    return {
      category: 'No Recent Activity',
      meaning: 'The customer has not responded after a recent touch, so the deal may be losing momentum.'
    };
  }

  if (text.includes('next step') || text.includes('not scheduled') || text.includes('no confirmed meeting')) {
    return {
      category: 'Next Step Missing',
      meaning: 'There is no clearly confirmed follow-up, so the deal owner should lock the next action.'
    };
  }

  if (text.includes('pricing') || text.includes('price') || text.includes('budget')) {
    return {
      category: 'Pricing Concern',
      meaning: 'This activity is connected to budget or pricing, so it may affect close confidence.'
    };
  }

  if (text.includes('decision-maker') || text.includes('economic buyer')) {
    return {
      category: 'Decision-Maker Unknown',
      meaning: 'The buying owner is unclear, so qualification needs review.'
    };
  }

  if (text.includes('scheduled') || text.includes('stakeholder') || text.includes('confirmed')) {
    return {
      category: 'Positive Engagement',
      meaning: 'The customer is engaged and there is evidence of forward movement.'
    };
  }

  return {
    category: 'General Activity',
    meaning: 'This activity adds context, but it does not contain a strong risk signal.'
  };
}

export function dealMatchesRiskCategory(
  drivers: DealDriver[] | undefined,
  health: string | undefined,
  category: RiskCategory
) {
  if (category === 'ALL') {
    return true;
  }

  if (category === 'HEALTHY' || category === 'AT_RISK' || category === 'NEEDS_REVIEW') {
    return health === category;
  }

  return (drivers ?? []).some((driver) => driver.label.toLowerCase() === category.toLowerCase());
}

export function driverSuggestion(label: string) {
  const normalizedLabel = label.toLowerCase();

  if (normalizedLabel.includes('competitor')) {
    return 'Send a competitor comparison and ask which buying criteria matters most.';
  }

  if (normalizedLabel.includes('next step')) {
    return 'Schedule a follow-up meeting and confirm the customer-owned next action.';
  }

  if (normalizedLabel.includes('recent activity') || normalizedLabel.includes('activity')) {
    return 'Send a follow-up and confirm whether the project is still active.';
  }

  if (normalizedLabel.includes('pricing') || normalizedLabel.includes('budget')) {
    return 'Clarify budget, pricing concerns, and the approval process.';
  }

  if (normalizedLabel.includes('decision-maker') || normalizedLabel.includes('economic buyer')) {
    return 'Identify the economic buyer before moving the deal forward.';
  }

  if (normalizedLabel.includes('positive') || normalizedLabel.includes('engagement') || normalizedLabel.includes('meeting')) {
    return 'Keep momentum by confirming timeline and implementation ownership.';
  }

  return 'Review the latest activity and confirm the clearest next action with the deal owner.';
}
