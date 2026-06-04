// ============================================================
// apiHandler.ts — All API calls (real data only, no mock fallback)
// ============================================================

import { DealBoard, BoardDetail, Deal, BriefData, Warning, PlaybookData, PlaybookCriterion, ActivityData, CrmFields, StageOptions, Notification, NotificationsResponse } from '../types/deal-boards.types';

// Re-export types so consumers only need to import from apiHandler
export type {
  DealBoard,
  BoardDetail,
  Deal,
  BriefData,
  Warning,
  PlaybookData,
  PlaybookCriterion,
  ActivityData,
  CrmFields,
  StageOptions,
  Notification,
  NotificationsResponse,
};

// ─── Base URL ────────────────────────────────────────────────

import { ENV } from '../config/env';
const BASE_URL = ENV.API_BASE_URL;

// ─── Core Fetch Utility ───────────────────────────────────────

export interface ApiFetchResult<T> {
  data: T;
}

/**
 * apiFetch — wraps fetch, throws on errors (no mock fallback).
 */
export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiFetchResult<T>> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`[apiFetch] ${endpoint} → HTTP ${res.status}`);
  }

  const json = await res.json();
  const responseData = (json as any).data ?? json;
  return { data: responseData as T };
}

// ─── GET Endpoints ────────────────────────────────────────────

/**
 * GET /api/deals/boards
 * Returns all deal board cards from HubSpot.
 */
export async function getDealBoards(): Promise<ApiFetchResult<DealBoard[]>> {
  const res = await fetch(`${BASE_URL}/api/deals/boards`);
  if (!res.ok) throw new Error('Backend error');
  const json = await res.json();
  if (json.success) {
    return { data: json.data };
  }
  throw new Error('Invalid response');
}

/**
 * GET /api/deals/boards/:boardId
 * Returns board name, ownerTag, and summary cards from HubSpot.
 */
export async function getBoardDetail(
  boardId: string
): Promise<ApiFetchResult<BoardDetail>> {
  const res = await fetch(`${BASE_URL}/api/deals/boards/${boardId}`);
  if (!res.ok) throw new Error('Backend error');
  const json = await res.json();
  if (json.success) {
    return { data: json.data };
  }
  throw new Error('Invalid response');
}

/**
 * GET /api/deals/boards/:boardId/deals
 * Returns ALL deals for the board from HubSpot.
 * Filtering (stage, forecastCategory, amount range, closeDate) and
 * grouping (by stage / by rep) are handled client-side.
 */
export async function getDeals(
  boardId: string
): Promise<ApiFetchResult<Deal[]>> {
  const res = await fetch(`${BASE_URL}/api/deals/boards/${boardId}/deals`);
  if (!res.ok) throw new Error('Backend error');
  const json = await res.json();
  if (json.success) {
    const mapped = (json.data || []).map((deal: any) => ({
      ...deal,
      assignedRep: deal.ownerName || deal.assignedRep || 'Unassigned',
      assignedRepEmail: deal.ownerEmail || deal.assignedRepEmail,
    }));
    return { data: mapped };
  }
  throw new Error('Invalid response');
}

/**
 * GET /api/deals/:dealId/brief
 * Returns AI summary, what changed this week, buyer sentiment,
 * last interaction, and key risks. Default tab on deal open.
 */
export function getDealBrief(dealId: string): Promise<ApiFetchResult<BriefData>> {
  return apiFetch<BriefData>(`/api/deals/${dealId}/brief`);
}

/**
 * GET /api/deals/:dealId/warnings
 * Returns all AI warnings for a deal with severity and status.
 */
export function getDealWarnings(dealId: string): Promise<ApiFetchResult<Warning[]>> {
  return apiFetch<Warning[]>(`/api/deals/${dealId}/warnings`);
}

/**
 * GET /api/deals/:dealId/playbook
 * Returns MEDDIC playbook criteria, completion status, score %, and
 * AI-suggested notes per criterion.
 */
export function getDealPlaybook(dealId: string): Promise<ApiFetchResult<PlaybookData>> {
  return apiFetch<PlaybookData>(`/api/deals/${dealId}/playbook`);
}

/**
 * GET /api/deals/:dealId/activity
 * Returns activity timeline with interaction counts and dated events.
 */
export function getDealActivity(dealId: string): Promise<ApiFetchResult<ActivityData>> {
  return apiFetch<ActivityData>(`/api/deals/${dealId}/activity`);
}

/**
 * GET /api/deals/:dealId/crm-fields
 * Returns current editable CRM fields for the Update CRM tab.
 */
export function getDealCrmFields(dealId: string): Promise<ApiFetchResult<CrmFields>> {
  return apiFetch<CrmFields>(`/api/deals/${dealId}/crm-fields`);
}

/**
 * GET /api/deals/stage-options
 * Returns available pipeline stages and forecast categories for
 * dropdowns in the Update CRM tab and filter panel.
 */
export function getStageOptions(): Promise<ApiFetchResult<StageOptions>> {
  return apiFetch<StageOptions>("/api/deals/stage-options");
}

/**
 * GET /api/notifications?repName=...
 * Returns recent notifications and unread count for the bell icon.
 */
export function getNotifications(repName?: string): Promise<ApiFetchResult<NotificationsResponse>> {
  const url = repName
    ? `/api/notifications?repName=${encodeURIComponent(repName)}`
    : "/api/notifications";
  return apiFetch<NotificationsResponse>(url);
}

// ─── PATCH / POST Mutations ───────────────────────────────────

/**
 * PATCH /api/deals/:dealId
 * Updates stage, amount, forecastCategory, nextStep, closeDate.
 * Triggered by "Save Changes" on the Update CRM tab.
 */
export async function updateDeal(
  dealId: string,
  body: Partial<CrmFields>
): Promise<{ message: string; dealId: string; updatedFields: Partial<CrmFields>; status: string }> {
  const res = await fetch(`${BASE_URL}/api/deals/${dealId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

/**
 * PATCH /api/deals/:dealId/playbook/criteria/:criterionId
 * Updates the completion status of a single MEDDIC criterion.
 * status must be "Completed" | "Pending" | "N/A"
 */
export async function updatePlaybookCriterion(
  dealId: string,
  criterionId: string,
  status: "Completed" | "Pending" | "N/A"
): Promise<{ message: string; criterionId: string; updatedStatus: string }> {
  const res = await fetch(
    `${BASE_URL}/api/deals/${dealId}/playbook/criteria/${criterionId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

/**
 * PATCH /api/deals/:dealId/warnings/:warningId
 * Marks a specific warning as resolved.
 * Body: { status: "resolved" }
 */
export async function resolveWarning(
  dealId: string,
  warningId: string
): Promise<{ message: string; warningId: string; status: string }> {
  const res = await fetch(
    `${BASE_URL}/api/deals/${dealId}/warnings/${warningId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "resolved" }),
    }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

/**
 * POST /api/deals/:dealId/warnings/:warningId/action
 * Triggers the recommended action for a warning
 * (e.g. schedule a call, send email).
 */
export async function triggerWarningAction(
  dealId: string,
  warningId: string
): Promise<{ message: string; actionTriggered: boolean; status: string }> {
  const res = await fetch(
    `${BASE_URL}/api/deals/${dealId}/warnings/${warningId}/action`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

/**
 * PATCH /api/notifications/read-all?repName=...
 * Marks all notifications as read.
 * Triggered by "Mark All as Read" button.
 */
export async function markAllNotificationsRead(repName?: string): Promise<{
  message: string;
  status: string;
}> {
  const url = repName
    ? `${BASE_URL}/api/notifications/read-all?repName=${encodeURIComponent(repName)}`
    : `${BASE_URL}/api/notifications/read-all`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}


