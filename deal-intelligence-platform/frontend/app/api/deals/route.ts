import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createDeal, getDeals } from "@/lib/local-store";

const createDealSchema = z.object({
  name: z.string().min(1),
  account: z.string().min(1),
  owner: z.string().min(1),
  deal_stage: z.string().default("Discovery"),
  opportunity_type: z.string().default("New Business"),
  deal_value: z.number().default(0),
  probability: z.number().min(0).max(100).default(25),
  close_date: z.string().optional()
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const deals = getDeals();
  const q = searchParams.get("q")?.toLowerCase();
  const health = searchParams.get("health");
  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 20);

  const filtered = deals.filter((deal) => {
    const matchesQuery = q ? `${deal.name} ${deal.account} ${deal.owner}`.toLowerCase().includes(q) : true;
    const matchesHealth = health ? deal.health_status === health : true;
    return matchesQuery && matchesHealth;
  });

  const start = (page - 1) * limit;
  return NextResponse.json({
    data: filtered.slice(start, start + limit),
    pagination: { page, limit, total: filtered.length }
  });
}

export async function POST(request: Request) {
  const payload = createDealSchema.parse(await request.json());
  const deal = createDeal(payload);
  return NextResponse.json({ data: deal }, { status: 201 });
}
