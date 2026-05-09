import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({ text: z.string().min(1) });

export async function POST(request: Request) {
  const payload = schema.parse(await request.json());
  const response = await fetch(`${process.env.ML_SERVICE_URL ?? "http://localhost:8000"}/api/v1/sentiment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store"
  }).catch(() => null);

  if (!response?.ok) {
    return NextResponse.json({ label: "neutral", score: 0.5, summary: payload.text.slice(0, 180) });
  }

  return NextResponse.json(await response.json());
}
