export type WarningSeverity = 'high' | 'medium' | 'low';

export interface AIWarning {
  severity: WarningSeverity;
  warning: string;
  source: string;
}

export interface RuleBasedWarning {
  warning: string;
  triggered_by: string;
}

export interface DealEvaluationResult {
  ai_score: number; // 0-100
  ai_score_rationale: string;
  ai_warnings_rep: AIWarning[];
  ai_warnings_manager: AIWarning[];
  rule_based_warnings: RuleBasedWarning[];
}

export interface DealParameters {
  stage: string;
  amount: number;
  companySize?: string;
  daysInStage?: number;
  contactActivity?: number;
  repNotes?: string;
  closeDate?: string;
  nextSteps?: string;
  stakeholders?: string[];
  aiScore?: number;
  warnings?: number;
  meddpiccPercent?: number;
  contacts?: number;
  activityData?: number[];
}

export interface APIResponse {
  // Raw JSON responses from external sales APIs
  [key: string]: any;
}

export interface KnowledgeBaseRule {
  id: string;
  stage: string;
  rule: string;
  threshold?: number;
  weight: number; // 1-10, higher = more important
  category: 'score' | 'rep_warning' | 'manager_warning';
}

export interface EvaluationInput {
  dealData: DealParameters;
  apiResponses: APIResponse[];
  knowledgeBase: KnowledgeBaseRule[];
}
