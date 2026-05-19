import type { Activity, AIScore, Deal, PlaybookItem, Warning } from "@dealboards/types";

export interface ApiDeal extends Deal {
  accountName?: string;
  owner?: string;
  ownerDisplayName?: string;
  dealSummary?: string;
  playbookCompletion?: number;
  value?: number;
  totalCalls?: number;
  totalEmails?: number;
  warningState?: string;
  aiExplanation?: string;
  aiScores: AIScore[];
  warnings: Warning[];
  activities: Activity[];
  contacts: Array<{ id: string; name: string; title?: string; isExec: boolean }>;
  playbookItems?: PlaybookItem[];
  crmSyncLogs?: Array<{ id: string; status: string; message?: string; createdAt: string }>;
}
