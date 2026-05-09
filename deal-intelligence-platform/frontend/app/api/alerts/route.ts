import { NextResponse } from "next/server";
import { getDeals } from "@/lib/local-store";

export async function GET() {
  const deals = getDeals();
  const alerts = deals
    .filter((deal) => deal.inactivity_days > 5 || deal.health_status === "At Risk")
    .map((deal) => ({
      id: `alert-${deal.id}`,
      deal_id: deal.id,
      severity: deal.health_status === "At Risk" ? "critical" : "warning",
      title: `${deal.account} needs attention`,
      message: deal.next_best_action
    }));

  return NextResponse.json({ data: alerts });
}
