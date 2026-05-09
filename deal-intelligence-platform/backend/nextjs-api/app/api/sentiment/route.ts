import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const payload = await request.json();
  const response = await fetch(`${process.env.ML_SERVICE_URL ?? "http://localhost:8000"}/api/v1/sentiment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return NextResponse.json(await response.json());
}
