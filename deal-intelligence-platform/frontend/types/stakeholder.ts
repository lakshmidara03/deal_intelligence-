import type { Deal } from "./deal";

export type StakeholderRole = "Champion" | "Economic Buyer" | "Technical Lead" | "Influencer" | "Blocker" | "Neutral";
export type StakeholderSentiment = "positive" | "neutral" | "negative";

export interface Stakeholder {
  id: string;
  name: string;
  title: string;
  role: StakeholderRole;
  influence: number; // 1-10
  sentiment: StakeholderSentiment;
  engagementScore: number; // 0-100
  lastInteractionDays: number;
  avatarUrl?: string;
}

export interface StakeholderMapData {
  dealId: string;
  stakeholders: Stakeholder[];
  connections: { source: string; target: string }[];
}

export function getStakeholderData(deal: Deal): StakeholderMapData {
  // Use deal name length/characters to create deterministic "random" values
  const seed = (deal.name?.length || 0) + (deal.account?.length || 0);
  
  const roles: StakeholderRole[] = ["Economic Buyer", "Champion", "Technical Lead", "Influencer", "Blocker", "Neutral"];
  const names = [
    ["Sarah Chen", "Marcus Thorne", "Elena Rodriguez", "David Park"],
    ["James Wilson", "Aria Smith", "Kenji Tanaka", "Zoe Miller"],
    ["Michael Brown", "Sarah Jenkins", "Robert Lowe", "Linda Wu"],
    ["Chris Evans", "Jessica Alba", "Tom Hardy", "Emily Blunt"]
  ];
  
  const currentNames = names[seed % names.length];
  
  const stakeholders: Stakeholder[] = currentNames.map((name, i) => {
    // Ensure we always have at least one Economic Buyer and one Champion for the POC
    const role = i === 0 ? "Economic Buyer" : i === 1 ? "Champion" : roles[(seed + i) % roles.length];
    const sentiment = (seed + i) % 3 === 0 ? "positive" : (seed + i) % 3 === 1 ? "neutral" : "negative";
    
    return {
      id: `sh-${deal.id}-${i}`,
      name,
      title: i === 0 ? "Chief Financial Officer" : i === 1 ? "Head of Engineering" : "Project Stakeholder",
      role,
      influence: i === 0 ? 10 : i === 1 ? 9 : 4 + ((seed + i) % 5),
      sentiment: i === 1 ? "positive" : sentiment,
      engagementScore: 40 + ((seed * i) % 60),
      lastInteractionDays: (seed + i) % 20,
    };
  });

  const connections = [
    { source: stakeholders[0].id, target: stakeholders[1].id },
    { source: stakeholders[1].id, target: stakeholders[2].id },
    { source: stakeholders[1].id, target: stakeholders[3].id },
  ];

  return {
    dealId: deal.id,
    stakeholders,
    connections,
  };
}
