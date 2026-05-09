import { NextResponse } from "next/server";
import { z } from "zod";
import { addInteraction, getInteractions } from "@/lib/local-store";

const schema = z.object({
  deal_id: z.string(),
  channel: z.enum(["email", "call", "meeting"]).default("call"),
  actor: z.string().default("Sales team"),
  summary: z.string().min(1),
  sentiment: z.enum(["positive", "neutral", "negative"]).default("neutral")
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  return NextResponse.json({ data: getInteractions(searchParams.get("deal_id") ?? undefined) });
}

export async function POST(request: Request) {
  const payload = schema.parse(await request.json());
  const interaction = addInteraction(payload);
  return NextResponse.json({ data: interaction }, { status: 201 });
}
