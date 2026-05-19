export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type SyncStatus = "syncing" | "synced" | "failed";
export type ForecastCategory = "PIPELINE" | "BEST_CASE" | "COMMIT";

export interface Board {
  id: string;
  title: string;
  description: string;
  owner: string;
  lastModified: string;
}

export interface Deal {
  id: string;
  name: string;
  stage: string;
  amount: number;
  closeDate: string | null;
  nextStep: string | null;
  forecastCategory: ForecastCategory;
  contactCount: number;
  activityCount: number;
  healthScore?: number;
  riskScore?: number;
  healthCategory?: "healthy" | "watch" | "risk";
  daysSinceLastContact?: number;
  engagementScore?: number;
  riskFlagCount?: number;
  lastActivityAt: string | null;
  aiScore?: AIScore;
  warnings?: Warning[];
}

export interface AIScore {
  id: string;
  score?: number;
  riskScore?: number;
  healthScore?: number;
  riskLevel?: RiskLevel;
  suggestedNextStep: string;
  explanation: string;
  positiveSignals: string[];
  negativeSignals: string[];
  scoreDrivers: string[];
  summary: string;
  buyerSentiment: string;
  whatChanged: string;
}

export interface Warning {
  id: string;
  code: string;
  title: string;
  severity: RiskLevel;
  explanation: string;
  suggestedMitigation: string;
  ctaAction: string;
}

export interface Activity {
  id: string;
  type: "CALL" | "EMAIL" | "MEETING" | "NOTE";
  subject: string;
  occurredAt: string;
  durationMinutes: number | null;
  sentiment: string | null;
}

export interface PlaybookItem {
  id: string;
  section: "Metrics" | "Economic Buyer" | "Decision Criteria" | "Decision Process" | "Champion" | "Competition";
  label: string;
  completed: boolean;
  aiSuggestion: string;
  notes: string;
}
