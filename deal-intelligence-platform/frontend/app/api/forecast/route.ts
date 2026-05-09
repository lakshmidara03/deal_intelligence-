import { NextResponse } from "next/server";
import { getDeals } from "@/lib/local-store";

export async function GET() {
  const deals = getDeals();
  return NextResponse.json({
    data: deals.map((deal) => ({
      deal_id: deal.id,
      forecast_trend: deal.forecast_trend,
      commit_probability: deal.probability,
      weighted_value: Math.round(deal.deal_value * deal.probability / 100)
    }))
  });
}
