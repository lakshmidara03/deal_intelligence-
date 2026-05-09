import { NextResponse } from "next/server";
import { getDeal, getInteractions } from "@/lib/local-store";
import { riskTimeline } from "@/lib/sample-data";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deal = getDeal(id);

  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  return NextResponse.json({
    data: deal,
    interactions: getInteractions(id),
    riskTimeline
  });
}
