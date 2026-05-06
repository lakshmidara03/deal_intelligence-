export type DealStage = 'DISCOVERY' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED_WON' | 'AT_RISK';
export type DealHealth = 'HEALTHY' | 'AT_RISK' | 'NEEDS_REVIEW';
export type DriverImpact = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
export type ActivityType = 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE';
export type AccountRole = 'ADMIN' | 'EMPLOYEE';

export type Account = {
  id: string;
  name: string;
  email: string;
  role: AccountRole;
  title: string;
  _count?: {
    deals: number;
  };
};

export type Activity = {
  id: string;
  dealId: string;
  type: ActivityType;
  title: string;
  summary: string;
  rawText: string;
  occurredAt: string;
};

export type DealDriver = {
  id: string;
  dealId: string;
  label: string;
  description: string;
  impact: DriverImpact;
};

export type DealInsight = {
  id: string;
  dealId: string;
  summary: string;
  interpretation: string;
  generatedAt: string;
};

export type Deal = {
  id: string;
  name: string;
  company: string;
  owner: string;
  value: number;
  stage: DealStage;
  closeDate: string;
  health: DealHealth;
  healthExplanation?: string;
  recommendedAction?: string;
  confidence: string;
  employee?: Account;
  activities?: Activity[];
  drivers?: DealDriver[];
  insights?: DealInsight[];
};
