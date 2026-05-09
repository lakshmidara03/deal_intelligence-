import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const response = await fetch(`${process.env.ML_SERVICE_URL ?? "http://localhost:8000"}/api/v1/agents/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store"
  }).catch(() => null);

  if (!response?.ok) {
    return NextResponse.json({
      workflow: "fallback",
      insights: ["Coordinator queued CRM, NLP, and forecast checks", "Delegator recommends manager review for risky deals"]
    });
  }

  return NextResponse.json(await response.json());
}
