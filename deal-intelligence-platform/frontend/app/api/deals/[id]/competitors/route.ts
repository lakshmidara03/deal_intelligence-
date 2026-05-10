import { NextRequest, NextResponse } from "next/server";
import { getCompetitorData } from "@/lib/local-store";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = getCompetitorData(id);
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
}
