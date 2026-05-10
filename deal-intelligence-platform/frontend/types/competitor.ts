import type { Deal } from "./deal";

export interface CompetitiveDimension {
  dimension: string;
  you: number;
  rivalA?: number;
  rivalB?: number;
  fullMark: number;
}

export interface CompetitorRadarData {
  dealId: string;
  rivalAName: string;
  rivalBName?: string;
  data: CompetitiveDimension[];
}

export const mockCompetitorData: CompetitorRadarData = {
  dealId: "deal-123",
  rivalAName: "Gong",
  rivalBName: "Chorus.ai",
  data: [
    { dimension: "Pricing strength", you: 78, rivalA: 90, rivalB: 65, fullMark: 100 },
    { dimension: "Relationship depth", you: 85, rivalA: 60, rivalB: 70, fullMark: 100 },
    { dimension: "Product fit", you: 90, rivalA: 75, rivalB: 68, fullMark: 100 },
    { dimension: "Support quality", you: 72, rivalA: 80, rivalB: 75, fullMark: 100 },
    { dimension: "Integration ease", you: 80, rivalA: 65, rivalB: 88, fullMark: 100 },
    { dimension: "Deal momentum", you: 78, rivalA: 55, rivalB: 60, fullMark: 100 },
  ],
};

export function getCompetitorsForDeal(deal: Deal): CompetitorRadarData {
  // Use deal name length/characters to create deterministic "random" values
  const seed = (deal.name?.length || 0) + (deal.account?.length || 0);
  
  const generateScore = (base: number, variance: number, idx: number) => {
    return Math.min(100, Math.max(30, base + ((seed * idx) % variance) - (variance / 2)));
  };

  const rivals = [
    ["Salesforce", "HubSpot"],
    ["Gong", "Chorus.ai"],
    ["Outreach", "Salesloft"],
    ["Zendesk", "Intercom"]
  ];
  const rivalPair = rivals[seed % rivals.length];

  return {
    dealId: deal.id,
    rivalAName: rivalPair[0],
    rivalBName: rivalPair[1],
    data: [
      { dimension: "Pricing strength", you: generateScore(80, 20, 1), rivalA: generateScore(75, 30, 2), rivalB: generateScore(65, 25, 3), fullMark: 100 },
      { dimension: "Relationship depth", you: generateScore(85, 15, 4), rivalA: generateScore(60, 40, 5), rivalB: generateScore(70, 30, 6), fullMark: 100 },
      { dimension: "Product fit", you: generateScore(90, 10, 7), rivalA: generateScore(80, 20, 8), rivalB: generateScore(68, 30, 9), fullMark: 100 },
      { dimension: "Support quality", you: generateScore(75, 25, 10), rivalA: generateScore(85, 15, 11), rivalB: generateScore(75, 20, 12), fullMark: 100 },
      { dimension: "Integration ease", you: generateScore(82, 18, 13), rivalA: generateScore(65, 35, 14), rivalB: generateScore(88, 12, 15), fullMark: 100 },
      { dimension: "Deal momentum", you: deal.health_status === "Healthy" ? 90 : deal.health_status === "At Risk" ? 40 : 70, rivalA: generateScore(60, 30, 16), rivalB: generateScore(65, 20, 17), fullMark: 100 },
    ],
  };
}

