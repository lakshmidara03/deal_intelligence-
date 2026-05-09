import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Deal, Interaction } from "@/types/deal";

const dataDir = join(process.cwd(), "data");
const datasetDealsPath = join(dataDir, "deals.json");
const datasetInteractionsPath = join(dataDir, "interactions.json");
const createdDealsPath = join(dataDir, "created-deals.json");
const createdInteractionsPath = join(dataDir, "created-interactions.json");

function ensureDataDir() {
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
}

function readJson<T>(path: string, fallback: T): T {
  if (!existsSync(path)) {
    return fallback;
  }
  return JSON.parse(readFileSync(path, "utf-8")) as T;
}

function writeJson<T>(path: string, value: T) {
  ensureDataDir();
  writeFileSync(path, JSON.stringify(value, null, 2), "utf-8");
}

export function getDeals(): Deal[] {
  return [...readJson<Deal[]>(datasetDealsPath, []), ...readJson<Deal[]>(createdDealsPath, [])];
}

export function getDeal(id: string): Deal | undefined {
  return getDeals().find((deal) => deal.id === id);
}

export function createDeal(input: Partial<Deal>): Deal {
  const created = readJson<Deal[]>(createdDealsPath, []);
  const now = Date.now();
  const deal: Deal = {
    id: input.id ?? `LOCAL-${now}`,
    name: input.name ?? "New Deal",
    account: input.account ?? "New Account",
    owner: input.owner ?? "Unassigned",
    deal_stage: input.deal_stage ?? "Discovery",
    opportunity_type: input.opportunity_type ?? "New Business",
    deal_value: Number(input.deal_value ?? 0),
    probability: Number(input.probability ?? 25),
    stage_age_days: Number(input.stage_age_days ?? 0),
    inactivity_days: Number(input.inactivity_days ?? 0),
    engagement_score: Number(input.engagement_score ?? 50),
    meetings_count: Number(input.meetings_count ?? 0),
    email_count: Number(input.email_count ?? 0),
    competitor_mentioned: Boolean(input.competitor_mentioned ?? false),
    next_step_defined: Boolean(input.next_step_defined ?? true),
    close_date_pushed: Boolean(input.close_date_pushed ?? false),
    sentiment_score: Number(input.sentiment_score ?? 0),
    forecast_trend: input.forecast_trend ?? "stable",
    health_status: input.health_status ?? "Needs Review",
    ai_confidence: Number(input.ai_confidence ?? 68),
    close_date: input.close_date ?? new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    drivers: input.drivers ?? ["newly created"],
    next_best_action: input.next_best_action ?? "Qualify buyer priorities and define the next dated step.",
    manual_next_step: input.manual_next_step ?? "",
    human_review_required: input.human_review_required ?? true,
    raw_details: input.raw_details ?? {
      "Deal Id": input.id ?? `LOCAL-${now}`,
      "Deal Name": input.name ?? "New Deal",
      "Account Name": input.account ?? "New Account",
      "Deal Owner": input.owner ?? "Unassigned",
      "Crm Stage": input.deal_stage ?? "Discovery",
      "Deal Value Inr": Number(input.deal_value ?? 0),
      "Probability Pct": Number(input.probability ?? 25),
      "Estimated Close Date": input.close_date ?? null
    }
  };
  writeJson(createdDealsPath, [deal, ...created]);
  return deal;
}

export function getInteractions(dealId?: string): Interaction[] {
  const all = [...readJson<Interaction[]>(datasetInteractionsPath, []), ...readJson<Interaction[]>(createdInteractionsPath, [])];
  return dealId ? all.filter((interaction) => interaction.deal_id === dealId) : all;
}

export function addInteraction(input: Partial<Interaction> & { deal_id: string; summary: string }): Interaction {
  const created = readJson<Interaction[]>(createdInteractionsPath, []);
  const interaction: Interaction = {
    id: input.id ?? `LOCAL-INT-${Date.now()}`,
    deal_id: input.deal_id,
    channel: input.channel ?? "call",
    actor: input.actor ?? "Sales team",
    summary: input.summary,
    sentiment: input.sentiment ?? "neutral",
    created_at: input.created_at ?? new Date().toISOString()
  };
  writeJson(createdInteractionsPath, [interaction, ...created]);
  return interaction;
}
