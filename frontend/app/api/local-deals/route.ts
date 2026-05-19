import { NextResponse } from "next/server";
import * as ExcelJS from "exceljs";
import { access, readFile } from "fs/promises";
import { resolve } from "path";
import type { ApiDeal } from "@/types/api";

type LocalDealRow = Record<string, unknown>;

let cachedDeals: ApiDeal[] | null = null;

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toStringValue(value: unknown, fallback = "") {
  if (value == null) return fallback;
  return String(value).trim() || fallback;
}

function toBool(value: unknown) {
  return ["true", "yes", "1", "y", "confirmed"].includes(toStringValue(value).toLowerCase());
}

function toDateString(value: unknown) {
  const date = value instanceof Date ? value : value ? new Date(String(value)) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toISOString() : null;
}

function scoreToHealthCategory(score: number) {
  if (score >= 70) return "healthy";
  if (score >= 40) return "watch";
  return "risk";
}

function forecastCategoryForStage(stage: string, probability: number) {
  const normalized = stage.toLowerCase();
  if (normalized.includes("commit") || normalized.includes("closed won") || normalized.includes("won")) return "COMMIT";
  if (probability >= 70 || normalized.includes("proposal") || normalized.includes("negotiation")) return "BEST_CASE";
  return "PIPELINE";
}

async function resolveDatasetPath() {
  const datasetFile = process.env.DATASET_FILE_PATH ?? "datasets/deal_intelligence_dataset_cleaned.xlsx";
  const candidates = [resolve(process.cwd(), "..", datasetFile), resolve(process.cwd(), datasetFile), resolve(process.cwd(), "..", "..", datasetFile)];
  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      continue;
    }
  }
  return candidates[0];
}

async function loadDealsFromExcel(): Promise<ApiDeal[]> {
  if (cachedDeals) return cachedDeals;

  const datasetPath = await resolveDatasetPath();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load((await readFile(datasetPath)) as any);
  const sheet = workbook.worksheets[0];
  if (!sheet) {
    cachedDeals = [];
    return cachedDeals;
  }

  const headers = (sheet.getRow(1).values as Array<string | number | undefined>)
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);

  const rows: LocalDealRow[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const record: LocalDealRow = {};
    headers.forEach((header, index) => {
      record[header] = row.getCell(index + 1).value instanceof Date ? (row.getCell(index + 1).value as Date).toISOString() : row.getCell(index + 1).text || row.getCell(index + 1).value || "";
    });
    if (Object.values(record).some((value) => value !== "" && value !== null && value !== undefined)) rows.push(record);
  });

  cachedDeals = rows.map((row, index) => {
    const riskScore = toNumber(row["Ai Risk Score"], 0);
    const healthScore = 100 - riskScore;
    const stage = toStringValue(row["Crm Stage"], "Qualification");
    const probability = toNumber(row["Probability Pct"], 0);
    const totalCalls = toNumber(row["Total Calls"], 0);
    const totalEmails = toNumber(row["Total Emails"], 0);
    const totalMeetings = toNumber(row["Total Meetings"], 0);
    const daysSinceLastContact = toNumber(row["Days Since Last Activity"], 0);
    const lastActivityAt = toDateString(row["Last Activity Date"]) ?? new Date(Date.now() - daysSinceLastContact * 86400000).toISOString();
    const competitorName = [row["Competitor 1"], row["Competitor 2"]].map((value) => toStringValue(value)).find(Boolean) || null;
    const dealId = toStringValue(row["Deal Id"], `local-${index + 1}`);
    const owner = toStringValue(row["Deal Owner"], "Sales Rep");
    const accountName = toStringValue(row["Account Name"], toStringValue(row["Industry"], "Imported Account"));
    const dealName = toStringValue(row["Deal Name"], `Deal ${index + 1}`);
    const nextStep = toStringValue(row["Next Step"], "");
    const dealSummary = toStringValue(row["Deal Summary"], `${dealName} for ${accountName}.`);
    const forecastCategory = forecastCategoryForStage(stage, probability);

    return {
      id: dealId,
      name: dealName,
      accountName,
      owner,
      ownerDisplayName: owner,
      stage,
      forecastCategory,
      amount: toNumber(row["Deal Value Inr"], 0),
      probability,
      createdDate: toDateString(row["Created Date"]),
      estimatedCloseDate: toDateString(row["Estimated Close Date"]),
      closeDate: toDateString(row["Estimated Close Date"]),
      daysInPipeline: toNumber(row["Days In Current Stage"], 0),
      healthScore,
      riskScore,
      healthCategory: scoreToHealthCategory(healthScore),
      engagementScore: Math.min(100, (totalCalls + totalEmails + totalMeetings) * 5),
      riskFlagCount: riskScore >= 70 ? 3 : riskScore >= 40 ? 2 : 1,
      riskFlagSummary: riskScore >= 70 ? "High-risk deal from Excel dataset" : "Monitor for risk signals",
      lastActivityAt,
      daysSinceLastContact,
      latestInsightAt: lastActivityAt,
      lastSignalAt: lastActivityAt,
      warningState: riskScore >= 70 ? "critical" : riskScore >= 40 ? "risk" : "none",
      sourceFreshnessState: "fresh",
      boardUpdatedAt: new Date().toISOString(),
      nextStep: nextStep || null,
      dealSummary,
      budgetConfirmed: toBool(row["Budget Confirmed"]),
      decisionMakerEngaged: toBool(row["Decision Maker Engaged"]),
      competitorName,
      totalCalls,
      totalEmails,
      lastCallSentiment: toStringValue(row["Last Call Sentiment"], "Neutral"),
      aiExplanation: `Risk is ${riskScore.toFixed(0)} because this row was loaded from the local Excel dataset.`,
      contactCount: toNumber(row["No Of Contacts"], 0),
      activityCount: totalCalls + totalEmails + totalMeetings,
      playbookCompletion: Math.max(0, Math.min(1, (toNumber(row["No Of Contacts"], 0) / 10) + (toBool(row["Decision Maker Engaged"]) ? 0.2 : 0) + (toBool(row["Budget Confirmed"]) ? 0.2 : 0))),
      aiScores: [
        {
          id: `${dealId}-score`,
          score: riskScore,
          riskScore,
          healthScore,
          confidenceScore: 0.7,
          positiveSignals: ["Loaded from local Excel source"],
          negativeSignals: riskScore >= 50 ? ["Risk score indicates elevated risk"] : ["Review the row for supporting CRM context"],
          explanation: `Risk score loaded from the local dataset row for ${dealName}.`,
          modelVersion: "local-excel-preview",
          generatedAt: new Date().toISOString()
        }
      ],
      warnings: [],
      activities: [],
      contacts: [],
      playbookItems: [],
      crmSyncLogs: []
    } as unknown as ApiDeal;
  });

  return cachedDeals;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim().toLowerCase() ?? "";
  const stage = url.searchParams.get("stage")?.trim().toLowerCase() ?? "";
  const forecastCategory = url.searchParams.get("forecastCategory")?.trim().toUpperCase() ?? "";

  const deals = await loadDealsFromExcel();
  const filtered = deals.filter((deal) => {
    const matchesQuery =
      !q ||
      [deal.name, deal.accountName, deal.ownerDisplayName, deal.stage, deal.nextStep, deal.dealSummary]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    const matchesStage = !stage || deal.stage.toLowerCase() === stage || deal.stage.toLowerCase().includes(stage);
    const matchesForecast = !forecastCategory || deal.forecastCategory === forecastCategory;
    return matchesQuery && matchesStage && matchesForecast;
  });

  return NextResponse.json(filtered);
}
