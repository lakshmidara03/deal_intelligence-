export type HealthStatus = "Healthy" | "Needs Review" | "At Risk";
export type Momentum = "increasing" | "stable" | "declining";

export type Deal = {
  id: string;
  name: string;
  account: string;
  owner: string;
  deal_stage: string;
  opportunity_type: string;
  deal_value: number;
  probability: number;
  stage_age_days: number;
  inactivity_days: number;
  engagement_score: number;
  meetings_count: number;
  email_count: number;
  competitor_mentioned: boolean;
  next_step_defined: boolean;
  close_date_pushed: boolean;
  sentiment_score: number;
  forecast_trend: Momentum;
  health_status: HealthStatus;
  ai_confidence: number;
  close_date: string;
  drivers: string[];
  next_best_action: string;
  manual_next_step?: string;
  human_review_required?: boolean;
  raw_details?: Record<string, string | number | boolean | null>;
};

export type Interaction = {
  id: string;
  deal_id: string;
  channel: "email" | "call" | "meeting";
  actor: string;
  summary: string;
  sentiment: "positive" | "neutral" | "negative";
  created_at: string;
};

export type RiskPoint = {
  date: string;
  risk: number;
  confidence: number;
};
