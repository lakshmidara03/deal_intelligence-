import { NextResponse } from "next/server";
import { deals } from "../../lib/sample-data";

export const runtime = "edge";

export async function GET() {
  return NextResponse.json({ data: deals });
}
