import { NextResponse } from "next/server";
import { z } from "zod";

const predictSchema = z.object({
  deal_stage: z.string(),
  opportunity_type: z.string(),
  deal_value: z.number(),
  probability: z.number(),
  stage_age_days: z.number(),
  inactivity_days: z.number(),
  engagement_score: z.number(),
  meetings_count: z.number(),
  email_count: z.number(),
  competitor_mentioned: z.boolean(),
  next_step_defined: z.boolean(),
  close_date_pushed: z.boolean(),
  sentiment_score: z.number(),
  forecast_trend: z.string()
});

export async function POST(request: Request) {
  const payload = predictSchema.parse(await request.json());
  const response = await fetch(`${process.env.ML_SERVICE_URL ?? "http://localhost:8000"}/api/v1/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store"
  }).catch(() => null);

  if (!response?.ok) {
    const riskScore =
      payload.inactivity_days * 4 +
      payload.stage_age_days * 1.2 +
      (payload.competitor_mentioned ? 20 : 0) +
      (payload.close_date_pushed ? 15 : 0) -
      payload.engagement_score * 0.35;
    const label = riskScore > 60 ? "At Risk" : riskScore > 35 ? "Needs Review" : "Healthy";
    return NextResponse.json({
      prediction: label,
      confidence: Math.min(95, Math.max(58, Math.round(Math.abs(riskScore) + 20))),
      drivers: ["fallback heuristic", "model service unavailable"]
    });
  }

  return NextResponse.json(await response.json());
}
