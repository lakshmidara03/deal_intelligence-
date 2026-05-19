import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import ExcelJS from "exceljs";
import pg from "pg";

const { Client } = pg;

const connectionString = process.env.DATABASE_URL;
const workbookPath = resolve(process.cwd(), process.argv[2] ?? "datasets/deal_intelligence_dataset_cleaned.xlsx");
const datasetId = "22222222-2222-2222-2222-222222222222";
const salesRepUserId = "11111111-1111-1111-1111-111111111111";

if (!connectionString) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const stageOrder = new Map([
  ["Prospecting", 0],
  ["Qualification", 1],
  ["Proposal", 2],
  ["Negotiation", 3],
  ["Closed Won", 4],
  ["Closed Lost", 4]
]);

const playbookSections = ["Metrics", "Economic Buyer", "Decision Criteria", "Decision Process", "Champion", "Competition"];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const asString = (value, fallback = "") => String(value ?? fallback).trim();
const asNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};
const toBool = (value) => ["yes", "true", "1", "confirmed"].includes(asString(value).toLowerCase());
const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
};
const validCompetitor = (value) => {
  const text = asString(value);
  return text && !["unknown", "none", "na", "n/a", "-"].includes(text.toLowerCase()) ? text : null;
};

function cellValue(value) {
  if (value == null) return "";
  if (value instanceof Date) return value;
  if (typeof value === "object") {
    if ("text" in value) return value.text;
    if ("result" in value) return value.result;
    if ("richText" in value) return value.richText.map((part) => part.text).join("");
  }
  return value;
}

function forecastCategory(stage, probability) {
  if (stage === "Closed Lost") return "CLOSED_LOST";
  if (stage === "Closed Won") return "COMMIT";
  if (probability >= 70 || stage === "Negotiation") return "COMMIT";
  if (probability >= 40 || stage === "Proposal") return "BEST_CASE";
  return "PIPELINE";
}

function healthCategory(status, healthScore) {
  const normalized = asString(status).toLowerCase();
  if (normalized.includes("risk")) return "risk";
  if (normalized.includes("review")) return "watch";
  if (normalized.includes("healthy")) return "healthy";
  return healthScore >= 70 ? "healthy" : healthScore >= 40 ? "watch" : "risk";
}

function warningState(riskScore, daysSinceLastActivity, budgetConfirmed, decisionMakerEngaged) {
  if (riskScore >= 80 || daysSinceLastActivity >= 45) return "critical";
  if (riskScore >= 60 || !budgetConfirmed || !decisionMakerEngaged) return "risk";
  if (riskScore >= 35 || daysSinceLastActivity >= 21) return "warning";
  return "none";
}

function sourceFreshness(daysSinceLastActivity) {
  if (daysSinceLastActivity <= 14) return "fresh";
  if (daysSinceLastActivity <= 30) return "partial";
  if (daysSinceLastActivity <= 60) return "stale";
  return "unavailable";
}

function riskSummary(flags) {
  return flags.length ? flags.join("; ") : null;
}

function buildRows(sheet) {
  const headerRow = sheet.getRow(1);
  const headers = [];
  headerRow.eachCell((cell, index) => {
    headers[index] = asString(cell.value);
  });

  const rows = [];
  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const record = {};
    headers.forEach((header, index) => {
      if (header) record[header] = cellValue(row.getCell(index).value);
    });
    if (Object.values(record).some((value) => value !== "" && value !== null && value !== undefined)) rows.push(record);
  }
  return rows;
}

function mapDeal(row, ownerId) {
  const stage = asString(row["Crm Stage"], "Qualification");
  const probability = asNumber(row["Probability Pct"]);
  const riskScore = clamp(asNumber(row["Ai Risk Score"]), 0, 100);
  const healthScore = clamp(100 - riskScore, 0, 100);
  const daysSinceLastActivity = asNumber(row["Days Since Last Activity"]);
  const budgetConfirmed = toBool(row["Budget Confirmed"]);
  const decisionMakerEngaged = toBool(row["Decision Maker Engaged"]);
  const competitorName = validCompetitor(row["Competitor 1"]) ?? validCompetitor(row["Competitor 2"]);
  const riskFlags = [];

  if (riskScore >= 60) riskFlags.push(`AI risk score is ${riskScore}`);
  if (!budgetConfirmed) riskFlags.push("budget is not confirmed");
  if (!decisionMakerEngaged) riskFlags.push("decision maker is not engaged");
  if (daysSinceLastActivity >= 21) riskFlags.push(`${daysSinceLastActivity} days since last activity`);
  if (competitorName) riskFlags.push(`${competitorName} is in the account`);

  return {
    id: randomUUID(),
    tenantId: null,
    datasetId,
    crmDealId: asString(row["Deal Id"], randomUUID()),
    accountId: null,
    accountName: asString(row["Account Name"], "Imported Account"),
    dealName: asString(row["Deal Name"], "Imported Deal"),
    ownerUserId: ownerId,
    ownerDisplayName: asString(row["Deal Owner"], "Sales Rep"),
    stage,
    stageOrder: stageOrder.get(stage) ?? 0,
    forecastCategory: forecastCategory(stage, probability),
    value: asNumber(row["Deal Value Inr"]),
    probability,
    createdDate: toDate(row["Created Date"]),
    closeDate: toDate(row["Estimated Close Date"]),
    daysInPipeline: asNumber(row["Days In Current Stage"]),
    healthScore,
    riskScore,
    healthCategory: healthCategory(row["Health Status"], healthScore),
    engagementScore: clamp(
      asNumber(row["Total Calls"]) * 2 + asNumber(row["Total Emails"]) * 0.8 + asNumber(row["Total Meetings"]) * 5,
      0,
      100
    ),
    riskFlagCount: riskFlags.length,
    riskFlagSummary: riskSummary(riskFlags),
    lastActivityAt: toDate(row["Last Activity Date"]),
    daysSinceLastContact: daysSinceLastActivity,
    latestInsightAt: new Date(),
    lastSignalAt: toDate(row["Last Activity Date"]),
    warningState: warningState(riskScore, daysSinceLastActivity, budgetConfirmed, decisionMakerEngaged),
    sourceFreshness: sourceFreshness(daysSinceLastActivity),
    boardUpdatedAt: new Date(),
    nextStep: asString(row["Next Step"]) || "Confirm next customer action and update close plan.",
    dealSummary: `${asString(row["Primary Product"], "Product")} opportunity in ${asString(row["Industry"], "Unknown industry")} for ${asString(row["Region"], "Unknown region")} sourced from ${asString(row["Deal Source"], "unknown source")}.`,
    budgetConfirmed,
    decisionMakerEngaged,
    competitorName,
    totalCalls: asNumber(row["Total Calls"]),
    totalEmails: asNumber(row["Total Emails"]),
    totalMeetings: asNumber(row["Total Meetings"]),
    lastCallSentiment: asString(row["Last Call Sentiment"], "Neutral"),
    aiExplanation: riskFlags.length
      ? `Risk is driven by ${riskFlags.join(", ")}.`
      : "Deal has strong engagement signals and no major missing qualification evidence.",
    contactCount: clamp(asNumber(row["No Of Contacts"]), 0, 25)
  };
}

function warningsForDeal(deal) {
  const warnings = [];
  if (deal.riskScore >= 60) {
    warnings.push({
      type: "high_ai_risk",
      severity: deal.riskScore >= 80 ? "critical" : "high",
      title: "High AI Risk Score",
      description: `AI risk score is ${deal.riskScore}.`,
      mitigation: "Review blockers, validate buyer commitment, and update the close plan.",
      cta: "Review risk drivers"
    });
  }
  if (deal.daysSinceLastContact >= 21) {
    warnings.push({
      type: "stale_activity",
      severity: deal.daysSinceLastContact >= 45 ? "critical" : "medium",
      title: "Activity Is Stale",
      description: `${deal.daysSinceLastContact} days since the last recorded activity.`,
      mitigation: "Schedule a customer touch and confirm the next milestone.",
      cta: "Schedule follow-up"
    });
  }
  if (!deal.budgetConfirmed) {
    warnings.push({
      type: "budget_unconfirmed",
      severity: "high",
      title: "Budget Not Confirmed",
      description: "The Excel row does not show confirmed budget.",
      mitigation: "Confirm budget owner, approval path, and purchase timing.",
      cta: "Confirm budget"
    });
  }
  if (!deal.decisionMakerEngaged) {
    warnings.push({
      type: "decision_maker_gap",
      severity: "high",
      title: "Decision Maker Gap",
      description: "Decision maker engagement is missing or unknown.",
      mitigation: "Map the economic buyer and request a direct validation meeting.",
      cta: "Map buyer"
    });
  }
  if (deal.competitorName && deal.riskScore >= 35) {
    warnings.push({
      type: "competitor_present",
      severity: "medium",
      title: "Competitor Present",
      description: `${deal.competitorName} is listed as a competitor.`,
      mitigation: "Document differentiation and align it to decision criteria.",
      cta: "Update compete plan"
    });
  }
  return warnings.slice(0, 4);
}

function activityRows(deal) {
  const rows = [];
  const baseDate = deal.lastActivityAt ?? new Date();
  if (deal.totalMeetings > 0) {
    rows.push(["meeting", "Customer meeting", `${deal.totalMeetings} total meetings recorded in Excel.`, 45, deal.lastCallSentiment, baseDate]);
  }
  if (deal.totalCalls > 0) {
    rows.push(["call", "Sales call", `${deal.totalCalls} total calls recorded in Excel.`, 30, deal.lastCallSentiment, new Date(baseDate.getTime() - 86400000)]);
  }
  if (deal.totalEmails > 0) {
    rows.push(["email", "Follow-up email", `${deal.totalEmails} total emails recorded in Excel.`, null, deal.lastCallSentiment, new Date(baseDate.getTime() - 172800000)]);
  }
  if (!rows.length) rows.push(["note", "Imported from Excel", "No activity counts were present for this deal.", null, null, baseDate]);
  return rows;
}

function playbookForDeal(deal) {
  const hasCompetitor = Boolean(deal.competitorName);
  const status = {
    Metrics: deal.value > 0 && deal.probability > 0 ? "complete" : "missing",
    "Economic Buyer": deal.decisionMakerEngaged ? "complete" : "missing",
    "Decision Criteria": hasCompetitor ? "in_progress" : "missing",
    "Decision Process": ["Negotiation", "Proposal", "Closed Won"].includes(deal.stage) ? "in_progress" : "missing",
    Champion: deal.decisionMakerEngaged && ["Positive", "Mixed"].includes(deal.lastCallSentiment) ? "complete" : "in_progress",
    Competition: hasCompetitor ? "in_progress" : "missing"
  };
  return playbookSections.map((section) => ({
    category: section,
    status: status[section],
    suggestion: `Validate ${section.toLowerCase()} evidence for ${deal.accountName}.`,
    notes: status[section] === "complete" ? "Derived from Excel signals." : ""
  }));
}

async function insertChunk(client, table, columns, rows, chunkSize = 500) {
  if (!rows.length) return;
  for (let start = 0; start < rows.length; start += chunkSize) {
    const chunk = rows.slice(start, start + chunkSize);
    const values = [];
    const placeholders = chunk.map((row, rowIndex) => {
      const rowPlaceholders = row.map((value, columnIndex) => {
        values.push(value);
        return `$${rowIndex * columns.length + columnIndex + 1}`;
      });
      return `(${rowPlaceholders.join(",")})`;
    });
    await client.query(
      `insert into ${table} (${columns.join(",")}) values ${placeholders.join(",")}`,
      values
    );
  }
}

const workbook = new ExcelJS.Workbook();
await workbook.xlsx.readFile(workbookPath);
const sheet = workbook.worksheets[0];
if (!sheet) throw new Error(`No worksheet found in ${workbookPath}`);

const excelRows = buildRows(sheet);
const ownerNames = Array.from(new Set(excelRows.map((row) => asString(row["Deal Owner"], "Sales Rep")))).sort();
const ownerIds = new Map(ownerNames.map((owner) => [owner, randomUUID()]));
ownerIds.set("Sales Rep", salesRepUserId);

const deals = excelRows.map((row) => mapDeal(row, ownerIds.get(asString(row["Deal Owner"], "Sales Rep"))));
const openBoardDeals = deals.filter((deal) => ["PIPELINE", "BEST_CASE", "COMMIT"].includes(deal.forecastCategory)).length;

const client = new Client({ connectionString });
await client.connect();

try {
  await client.query("begin");
  await client.query(`
    truncate table
      contacts,
      activities,
      warnings,
      ai_scores,
      playbook_items,
      crm_sync_logs,
      deals,
      uploaded_datasets,
      board_views,
      users
    cascade
  `);

  const userRows = [
    [salesRepUserId, "Sales Rep", "sales.rep@example.com", "sales_rep"],
    ...ownerNames
      .filter((owner) => owner !== "Sales Rep")
      .map((owner) => [ownerIds.get(owner), owner, `${owner.toLowerCase().replace(/[^a-z0-9]+/g, ".")}@example.com`, "sales_rep"])
  ];
  await insertChunk(client, "users", ["id", "full_name", "email", "role"], userRows);

  await client.query(
    `insert into uploaded_datasets (id, file_name, row_count, upload_status, validation, metrics, training_completed)
     values ($1,$2,$3,'processed',$4,$5,true)`,
    [
      datasetId,
      workbookPath.split(/[\\/]/).pop(),
      excelRows.length,
      JSON.stringify({ source: "excel_import", worksheet: sheet.name, importedRows: excelRows.length }),
      JSON.stringify({
        openBoardDeals,
        totalDeals: deals.length,
        totalValue: deals.reduce((sum, deal) => sum + deal.value, 0),
        averageRiskScore: Number((deals.reduce((sum, deal) => sum + deal.riskScore, 0) / deals.length).toFixed(2))
      })
    ]
  );

  await client.query(
    `insert into board_views (user_id, board_name, filters, grouping, sorting, visible_columns, is_default)
     values ($1,'My Deals Board',$2,$3,$4,$5,true)`,
    [
      salesRepUserId,
      JSON.stringify({ owner: "me", stage_not: "Closed Lost", source: "Excel import" }),
      JSON.stringify({ field: "stage" }),
      JSON.stringify({ field: "risk_score", direction: "desc" }),
      JSON.stringify(["deal_name", "account_name", "stage", "value", "health_score", "risk_score", "warnings", "activity", "playbook", "next_step"])
    ]
  );

  await insertChunk(
    client,
    "deals",
    [
      "id", "tenant_id", "dataset_id", "crm_deal_id", "account_id", "account_name", "deal_name",
      "owner_user_id", "owner_display_name", "stage", "stage_order", "forecast_category", "value",
      "probability", "created_date", "estimated_close_date", "days_in_pipeline", "health_score",
      "risk_score", "health_category", "engagement_score", "risk_flag_count", "risk_flag_summary",
      "last_activity_at", "days_since_last_contact", "latest_insight_at", "last_signal_at",
      "warning_state", "source_freshness_state", "board_updated_at", "next_step", "deal_summary",
      "budget_confirmed", "decision_maker_engaged", "competitor_name", "total_calls", "total_emails",
      "last_call_sentiment", "ai_explanation"
    ],
    deals.map((deal) => [
      deal.id, deal.tenantId, deal.datasetId, deal.crmDealId, deal.accountId, deal.accountName, deal.dealName,
      deal.ownerUserId, deal.ownerDisplayName, deal.stage, deal.stageOrder, deal.forecastCategory, deal.value,
      deal.probability, deal.createdDate, deal.closeDate, deal.daysInPipeline, deal.healthScore,
      deal.riskScore, deal.healthCategory, deal.engagementScore, deal.riskFlagCount, deal.riskFlagSummary,
      deal.lastActivityAt, deal.daysSinceLastContact, deal.latestInsightAt, deal.lastSignalAt,
      deal.warningState, deal.sourceFreshness, deal.boardUpdatedAt, deal.nextStep, deal.dealSummary,
      deal.budgetConfirmed, deal.decisionMakerEngaged, deal.competitorName, deal.totalCalls, deal.totalEmails,
      deal.lastCallSentiment, deal.aiExplanation
    ]),
    250
  );

  const contactRows = [];
  const activityInsertRows = [];
  const warningRows = [];
  const aiScoreRows = [];
  const playbookRows = [];
  const syncRows = [];

  for (const deal of deals) {
    for (let index = 0; index < deal.contactCount; index += 1) {
      const isDecisionMaker = index === 0 && deal.decisionMakerEngaged;
      const contactName = `${deal.accountName} Contact ${index + 1}`.slice(0, 255);
      contactRows.push([
        deal.id,
        contactName,
        `contact${index + 1}.${deal.crmDealId.toLowerCase()}@example.com`,
        isDecisionMaker ? "Decision Maker" : index === 0 ? "Primary Stakeholder" : "Stakeholder",
        isDecisionMaker,
        clamp(deal.engagementScore - index * 3, 0, 100)
      ]);
    }

    for (const activity of activityRows(deal)) {
      activityInsertRows.push([deal.id, ...activity]);
    }

    for (const warning of warningsForDeal(deal)) {
      warningRows.push([
        deal.id,
        warning.type,
        warning.severity,
        warning.title,
        warning.description,
        warning.mitigation,
        warning.cta,
        true,
        "excel_import"
      ]);
    }

    aiScoreRows.push([
      deal.id,
      deal.riskScore,
      deal.healthScore,
      86,
      JSON.stringify([
        deal.totalCalls > 0 ? `${deal.totalCalls} calls` : null,
        deal.totalEmails > 0 ? `${deal.totalEmails} emails` : null,
        deal.decisionMakerEngaged ? "decision maker engaged" : null
      ].filter(Boolean)),
      JSON.stringify([
        !deal.budgetConfirmed ? "budget not confirmed" : null,
        !deal.decisionMakerEngaged ? "decision maker gap" : null,
        deal.daysSinceLastContact >= 21 ? "stale activity" : null,
        deal.competitorName ? "competitor present" : null
      ].filter(Boolean)),
      deal.aiExplanation,
      deal.nextStep,
      deal.dealSummary,
      deal.lastCallSentiment,
      "Imported from Excel and enriched for board projection.",
      "excel-import-v1"
    ]);

    for (const item of playbookForDeal(deal)) {
      playbookRows.push([deal.id, item.category, item.status, item.suggestion, item.notes]);
    }

    syncRows.push([
      deal.id,
      "synced",
      "Imported from Excel into local deal board.",
      JSON.stringify({ crmDealId: deal.crmDealId, source: "excel_import" }),
      new Date()
    ]);
  }

  await insertChunk(client, "contacts", ["deal_id", "name", "email", "role", "is_decision_maker", "engagement_score"], contactRows, 1000);
  await insertChunk(
    client,
    "activities",
    ["deal_id", "activity_type", "subject", "description", "duration_minutes", "sentiment", "occurred_at"],
    activityInsertRows,
    1000
  );
  await insertChunk(
    client,
    "warnings",
    ["deal_id", "warning_type", "severity", "title", "description", "mitigation", "cta_action", "is_active", "generated_by"],
    warningRows,
    1000
  );
  await insertChunk(
    client,
    "ai_scores",
    [
      "deal_id", "risk_score", "health_score", "confidence_score", "positive_signals", "negative_signals",
      "explanation", "suggested_next_step", "brief_summary", "buyer_sentiment", "what_changed", "model_version"
    ],
    aiScoreRows,
    500
  );
  await insertChunk(
    client,
    "playbook_items",
    ["deal_id", "category", "status", "ai_suggestion", "notes"],
    playbookRows,
    1000
  );
  await insertChunk(
    client,
    "crm_sync_logs",
    ["deal_id", "sync_status", "message", "payload", "synced_at"],
    syncRows,
    1000
  );

  await client.query("commit");

  console.log(JSON.stringify({
    importedDeals: deals.length,
    openBoardDeals,
    users: userRows.length,
    contacts: contactRows.length,
    activities: activityInsertRows.length,
    warnings: warningRows.length,
    aiScores: aiScoreRows.length,
    playbookItems: playbookRows.length,
    crmSyncLogs: syncRows.length
  }, null, 2));
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  await client.end();
}
