import { NextResponse } from "next/server";
import { getDeals } from "@/lib/local-store";

export async function GET() {
  const deals = getDeals();
  const pipeline = deals.reduce((sum, deal) => sum + deal.deal_value, 0);
  const weightedPipeline = deals.reduce((sum, deal) => sum + deal.deal_value * (deal.probability / 100), 0);
  const healthMix = deals.reduce<Record<string, number>>((acc, deal) => {
    acc[deal.health_status] = (acc[deal.health_status] ?? 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({ pipeline, weightedPipeline, healthMix });
}
