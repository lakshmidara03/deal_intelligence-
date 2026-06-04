import { ENV } from '../config/env';
import type {
  Deal,
  DealCommentPayload,
  DealDetail,
  DealTaskPayload,
  PipelineSummary,
} from '../types/deal.types';

// ─── GET /api/deals ───────────────────────────────────────────────────────

export async function fetchDeals(): Promise<Deal[]> {
  const res = await fetch(`${ENV.API_BASE_URL}/api/deals/all`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch deals: ${res.status}`);
  }

  const response = await res.json();
  const data = response.data || response;

  if (!Array.isArray(data)) {
    throw new Error('API returned non-array data');
  }

  return data.map((deal: any) => ({
    ...deal,
    amount: deal.amountDisplay || deal.amount,
    owner: {
      name: deal.ownerName || deal.owner?.name || 'Unassigned',
      email: deal.ownerEmail || deal.owner?.email,
      initials: deal.owner?.initials || (deal.ownerName || 'UN').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
      color: deal.owner?.color || '#4f46e5',
    },
  }));
}

// ─── GET /api/deals/pipeline-summary ──────────────────────────────────────

export async function fetchPipelineSummary(): Promise<PipelineSummary[]> {
  const res = await fetch(`${ENV.API_BASE_URL}/api/deals/pipeline-summary`, {
    cache: 'no-store',
  });

  if (!res.ok) throw new Error(`Failed to fetch pipeline summary: ${res.status}`);

  const response = await res.json();
  const data = response.data || response;
  if (!Array.isArray(data)) throw new Error('Invalid pipeline summary response');
  return data;
}

export async function fetchDealDetail(dealId: string): Promise<DealDetail> {
  // Call individual endpoints that exist in the backend
  const [briefRes, warningsRes, playbookRes, activityRes, crmRes] = await Promise.all([
    fetch(`${ENV.API_BASE_URL}/api/deals/${dealId}/brief`, { cache: 'no-store' }),
    fetch(`${ENV.API_BASE_URL}/api/deals/${dealId}/warnings`, { cache: 'no-store' }),
    fetch(`${ENV.API_BASE_URL}/api/deals/${dealId}/playbook`, { cache: 'no-store' }),
    fetch(`${ENV.API_BASE_URL}/api/deals/${dealId}/activity`, { cache: 'no-store' }),
    fetch(`${ENV.API_BASE_URL}/api/deals/${dealId}/crm-fields`, { cache: 'no-store' }),
  ]);

  const brief = briefRes.ok ? await briefRes.json().then((j: any) => j.data ?? j) : null;
  const warnings = warningsRes.ok ? await warningsRes.json().then((j: any) => j.data ?? j) : [];
  const playbook = playbookRes.ok ? await playbookRes.json().then((j: any) => j.data ?? j) : null;
  const activity = activityRes.ok ? await activityRes.json().then((j: any) => j.data ?? j) : null;
  const crm = crmRes.ok ? await crmRes.json().then((j: any) => j.data ?? j) : null;

  if (!brief) throw new Error('Brief not available');

  // Map rep endpoint data to manager DealDetail format
  const detail: DealDetail = {
    dealId,
    company: '',
    aiSummary: brief.aiSummary || '',
    weeklyChange: brief.whatChangedThisWeek || '',
    buyerSentiment: brief.buyerSentiment || 'Neutral',
    lastInteraction: brief.lastInteraction || '',
    keyRisks: brief.keyRisks || '',
    activeWarnings: Array.isArray(warnings) ? warnings.map((w: any) => w.title || w.description || '') : [],
    playbookCompletion: playbook?.scorePercentage ?? 0,
    meddic: Array.isArray(playbook?.criteria)
      ? playbook.criteria.map((c: any) => ({
          label: c.criterionName || '',
          status: c.status || 'Pending',
          question: c.question || '',
          answer: c.notes || '',
          note: c.aiSuggestedNote || undefined,
        }))
      : [],
    nextSteps: [playbook?.criteria?.find((c: any) => c.status === 'Pending')?.aiSuggestedNote || ''].filter(Boolean),
    activity: {
      interactionCount: activity?.ourInteractions ?? 0,
      customerInteractionCount: activity?.customerInteractions ?? 0,
      totalTime: `${Math.round(activity?.totalMinutes ?? 0)}min`,
      timeline: [],
      details: Array.isArray(activity?.events)
        ? activity.events.map((e: any) => ({
            title: e.notes || 'Activity',
            subtitle: e.type || '',
            type: e.direction === 'inbound' ? 'customer' : 'our',
            duration: `${e.duration || 0}min`,
            date: e.date || '',
            direction: e.direction || 'outbound',
            participants: e.participants || [],
          }))
        : [],
    },
    crm: {
      forecastCategory: (crm?.forecastCategory || 'Open') as any,
      nextStep: crm?.nextStep || '',
    },
  };

  return detail;
}

export async function postDealComment(
  dealId: string,
  payload: DealCommentPayload
): Promise<void> {
  const res = await fetch(`${ENV.API_BASE_URL}/api/deals/${dealId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`Failed to post deal comment: ${res.status}`);
}

export async function createDealTask(payload: DealTaskPayload): Promise<void> {
  const res = await fetch(`${ENV.API_BASE_URL}/api/deals/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`Failed to create deal task: ${res.status}`);
}

export async function updateDealEscalation(
  dealId: string,
  escalated: boolean
): Promise<void> {
  const res = await fetch(`${ENV.API_BASE_URL}/api/deals/${dealId}/escalation`, {
    method: escalated ? 'POST' : 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: escalated ? JSON.stringify({ escalated: true }) : undefined,
  });

  if (!res.ok) throw new Error(`Failed to update deal escalation: ${res.status}`);
}

export async function createRepNotification(payload: {
  repName: string;
  message: string;
  type?: string;
}): Promise<void> {
  const res = await fetch(`${ENV.API_BASE_URL}/api/deals/notifications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`Failed to create notification: ${res.status}`);
}

export async function updateDeal(
  dealId: string,
  updates: {
    stage?: string;
    forecastCategory?: string;
    amount?: string;
    nextStep?: string;
    meddpiccPercent?: number;
  }
): Promise<void> {
  const res = await fetch(`${ENV.API_BASE_URL}/api/deals/${dealId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  if (!res.ok) throw new Error(`Failed to update deal: ${res.status}`);
}

export async function exportDealsCsv(deals: Deal[]): Promise<string> {
  const csv = buildDealsCsv(deals);
  // Prepend UTF-8 BOM (\ufeff) to force Excel to parse it as UTF-8, preserving all symbols correctly
  return '\ufeff' + csv;
}

function buildDealsCsv(deals: Deal[]) {
  const headers = [
    'Deal Name',
    'Owner',
    'Stage',
    'Category',
    'Amount',
    'AI Score',
    'Warnings',
    'MEDDPICC %',
    'Contacts',
  ];
  const rows = deals.map((deal) => [
    deal.name,
    deal.owner.name,
    deal.stage,
    deal.category,
    deal.amount,
    `${deal.aiScore}%`,
    deal.warnings,
    `${deal.meddpiccPercent}%`,
    deal.contacts,
  ]);

  return [headers, ...rows]
    .map((row) => row.map((value) => escapeCsvValue(value)).join(','))
    .join('\n');
}

function escapeCsvValue(value: string | number) {
  const text = String(value);
  return `"${text.replace(/"/g, '""')}"`;
}
