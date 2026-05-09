import { NextResponse } from "next/server";
import { deals } from "../../lib/sample-data";

export const runtime = "edge";

export async function GET() {
  return NextResponse.json({
    pipeline: deals.reduce((sum, deal) => sum + deal.deal_value, 0),
    weighted: deals.reduce((sum, deal) => sum + deal.deal_value * deal.probability / 100, 0)
  });
}
