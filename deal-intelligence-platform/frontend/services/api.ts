import type { Deal } from "@/types/deal";

const ML_BASE_URL = process.env.ML_SERVICE_URL ?? "http://localhost:8000";

export async function predictDealHealth(deal: Deal) {
  const response = await fetch(`${ML_BASE_URL}/api/v1/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(deal),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Prediction service failed");
  }

  return response.json();
}
