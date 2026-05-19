import { BadRequestException, Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import { randomUUID } from "crypto";
import * as ExcelJS from "exceljs";
import FormData from "form-data";
import { access, readFile } from "fs/promises";
import { resolve } from "path";
import { AiService } from "../ai/ai.service";
import { DatabaseService } from "../database/database.service";

const PLAYBOOK_SECTIONS = ["Metrics", "Economic Buyer", "Decision Criteria", "Decision Process", "Champion", "Competition"];

@Injectable()
export class DatasetUploadService implements OnApplicationBootstrap {
  private readonly aiUrl: string;
  private readonly datasetPath: string;
  private readonly logger = new Logger(DatasetUploadService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly ai: AiService,
    config: ConfigService
  ) {
    this.aiUrl = config.get<string>("AI_SERVICE_URL", "http://127.0.0.1:8001");
    this.datasetPath = config.get<string>("DATASET_FILE_PATH", "datasets/deals.xlsx");
  }

  async onApplicationBootstrap() {
    void this.autoLoadConfiguredDataset();
  }

  private async autoLoadConfiguredDataset() {
    try {
      const absolutePath = await this.resolveDatasetPath();
      await access(absolutePath);

      const existing = await this.db.one<{ count: string }>("select count(*) from deals");
      if (Number(existing?.count ?? 0) > 0) {
        this.logger.log(`Dataset already loaded, skipping auto-load for ${this.datasetPath}`);
        return;
      }

      this.logger.log(`Auto-loading dataset from ${this.datasetPath}`);
      await this.ingestFromConfiguredPath();
      this.logger.log(`Loaded dataset from ${this.datasetPath}`);
    } catch (error) {
      this.logger.warn(`Dataset auto-load skipped: ${(error as Error).message}`);
    }
  }

  async ingest(file?: Express.Multer.File) {
    if (!file) throw new BadRequestException("Excel file is required");
    if (!file.originalname.match(/\.(xlsx|xls)$/i)) throw new BadRequestException("Only .xlsx and .xls files are supported");

    const rows = file.originalname.toLowerCase().endsWith(".xls") ? await this.parseLegacyExcel(file) : await this.parseExcel(file.buffer);
    if (!rows.length) throw new BadRequestException("Dataset has no rows");

    const aiResponse = await axios.post(`${this.aiUrl}/dataset/upload`, { filename: file.originalname, rows });
    const dataset = await this.db.one(
      `insert into uploaded_datasets (file_name, row_count, upload_status, validation, metrics, training_completed)
       values ($1,$2,'processed',$3,$4,true) returning *`,
      [file.originalname, rows.length, JSON.stringify(aiResponse.data.validation ?? {}), JSON.stringify(aiResponse.data.metrics ?? {})]
    );

    let importedDeals = 0;
    for (const row of aiResponse.data.records ?? rows) {
      const deal = await this.upsertDeal(row, dataset.id);
      if (row.prediction) await this.ai.persistAiResult(deal.id, row.prediction);
      importedDeals += 1;
    }

    return { dataset, importedDeals, metrics: aiResponse.data.metrics };
  }

  async ingestFromConfiguredPath() {
    const absolutePath = await this.resolveDatasetPath();
    const buffer = await readFile(absolutePath);
    const filename = absolutePath.split(/[\\/]/).pop() ?? "dataset.xlsx";
    const file = { buffer, originalname: filename } as Express.Multer.File;
    return this.ingest(file);
  }

  private async resolveDatasetPath() {
    const candidates = [
      resolve(process.cwd(), this.datasetPath),
      resolve(process.cwd(), "..", this.datasetPath)
    ];
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

  private async upsertDeal(row: Record<string, any>, datasetId: string) {
    const data = this.dealData(row);
    const deal = await this.db.one(
      `insert into deals (
        dataset_id, crm_deal_id, account_name, deal_name, owner_display_name, stage, forecast_category,
        value, probability, created_date, estimated_close_date, days_in_pipeline, health_score,
        risk_score, health_category, engagement_score, risk_flag_count, last_activity_at,
        days_since_last_contact, next_step, deal_summary, budget_confirmed, decision_maker_engaged,
        competitor_name, total_calls, total_emails, last_call_sentiment, ai_explanation, board_updated_at
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::health_category_enum,$16,0,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,now()
      )
      on conflict (crm_deal_id) do update set
        dataset_id = excluded.dataset_id,
        account_name = excluded.account_name,
        deal_name = excluded.deal_name,
        owner_display_name = excluded.owner_display_name,
        stage = excluded.stage,
        forecast_category = excluded.forecast_category,
        value = excluded.value,
        probability = excluded.probability,
        created_date = excluded.created_date,
        estimated_close_date = excluded.estimated_close_date,
        days_in_pipeline = excluded.days_in_pipeline,
        health_score = excluded.health_score,
        risk_score = excluded.risk_score,
        health_category = excluded.health_category,
        engagement_score = excluded.engagement_score,
        last_activity_at = excluded.last_activity_at,
        days_since_last_contact = excluded.days_since_last_contact,
        next_step = excluded.next_step,
        deal_summary = excluded.deal_summary,
        budget_confirmed = excluded.budget_confirmed,
        decision_maker_engaged = excluded.decision_maker_engaged,
        competitor_name = excluded.competitor_name,
        total_calls = excluded.total_calls,
        total_emails = excluded.total_emails,
        last_call_sentiment = excluded.last_call_sentiment,
        ai_explanation = excluded.ai_explanation,
        board_updated_at = now()
      returning *`,
      [
        datasetId,
        data.crmDealId,
        data.accountName,
        data.dealName,
        data.owner,
        data.stage,
        data.forecastCategory,
        data.value,
        data.probability,
        data.createdDate,
        data.closeDate,
        data.daysInPipeline,
        data.healthScore,
        data.riskScore,
        data.healthCategory,
        data.engagementScore,
        data.lastActivityAt,
        data.daysSinceLastContact,
        data.nextStep,
        data.dealSummary,
        data.budgetConfirmed,
        data.decisionMakerEngaged,
        data.competitorName,
        data.totalCalls,
        data.totalEmails,
        data.lastCallSentiment,
        row.prediction?.explanation ?? null
      ]
    );

    await this.replaceContacts(deal.id, data.contactCount, data.decisionMakerEngaged);
    await this.replaceActivities(deal.id, data.activityCount, data.lastActivityAt, data.lastCallSentiment);
    await this.ensurePlaybook(deal.id);
    return deal;
  }

  private async replaceContacts(dealId: string, count: number, decisionMakerEngaged: boolean) {
    await this.db.query("delete from contacts where deal_id = $1", [dealId]);
    for (let index = 0; index < count; index += 1) {
      await this.db.query(
        "insert into contacts (deal_id, name, role, is_decision_maker) values ($1,$2,$3,$4)",
        [dealId, `Contact ${index + 1}`, index === 0 && decisionMakerEngaged ? "Decision Maker" : "Stakeholder", index === 0 && decisionMakerEngaged]
      );
    }
  }

  private async replaceActivities(dealId: string, count: number, lastActivityAt: Date, sentiment: string) {
    await this.db.query("delete from activities where deal_id = $1", [dealId]);
    for (let index = 0; index < count; index += 1) {
      await this.db.query(
        `insert into activities (deal_id, activity_type, subject, occurred_at, duration_minutes, sentiment)
         values ($1,$2::activity_type_enum,$3,$4,$5,$6)`,
        [
          dealId,
          index % 3 === 0 ? "meeting" : index % 2 === 0 ? "call" : "email",
          index % 3 === 0 ? "Customer meeting" : index % 2 === 0 ? "Discovery call" : "Follow-up email",
          new Date(lastActivityAt.getTime() - index * 86400000),
          index % 2 === 0 ? 30 : null,
          sentiment || null
        ]
      );
    }
  }

  private async parseExcel(buffer: Buffer) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    const sheet = workbook.worksheets[0];
    if (!sheet) return [];
    const headers = (sheet.getRow(1).values as Array<string | number | undefined>).map((value) => String(value ?? "").trim()).filter(Boolean);
    const rows: Record<string, unknown>[] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const record: Record<string, unknown> = {};
      headers.forEach((header, index) => {
        record[header] = this.cellValue(row.getCell(index + 1).value);
      });
      if (Object.values(record).some((value) => value !== "" && value !== null && value !== undefined)) rows.push(record);
    });
    return rows;
  }

  private cellValue(value: ExcelJS.CellValue) {
    if (value == null) return "";
    if (value instanceof Date) return value.toISOString();
    if (typeof value === "object") {
      if ("text" in value) return value.text;
      if ("result" in value) return value.result;
      if ("richText" in value) return value.richText.map((part) => part.text).join("");
    }
    return value;
  }

  private async parseLegacyExcel(file: Express.Multer.File) {
    const form = new FormData();
    form.append("file", file.buffer, file.originalname);
    const { data } = await axios.post(`${this.aiUrl}/dataset/upload-file`, form, { headers: form.getHeaders() });
    return data.records as Record<string, unknown>[];
  }

  private dealData(row: Record<string, any>) {
    const riskScore = Number(row.risk_score ?? row["Ai Risk Score"] ?? row["Risk Score"] ?? row.prediction?.risk_score ?? 0);
    const healthScore = Number(row.health_score ?? row.prediction?.health_score ?? 100 - riskScore);
    const totalCalls = Number(row.total_calls ?? row["Total Calls"] ?? 0);
    const totalEmails = Number(row.total_emails ?? row["Total Emails"] ?? 0);
    const totalMeetings = Number(row.total_meetings ?? row["Total Meetings"] ?? 0);
    const daysSinceLastContact = Number(row.days_since_last_contact ?? row["Days Since Last Activity"] ?? row.inactivity_score ?? 0);
    const lastActivityAt = this.toDate(row.last_activity_at ?? row["Last Activity Date"]) ?? new Date(Date.now() - daysSinceLastContact * 86400000);
    const competitorName = [row.competitor, row["Competitor 1"], row["Competitor 2"]].map((value) => String(value ?? "").trim()).find((value) => value && !["unknown", "na", "n/a", "none"].includes(value.toLowerCase())) || null;
    return {
      crmDealId: String(row.deal_id || row["Deal Id"] || row.external_id || row.id || row.deal_name || randomUUID()),
      dealName: String(row.deal_name || row["Deal Name"] || "Untitled Deal").trim(),
      accountName: String(row.account_name || row["Account Name"] || row.account || row.industry || row.account_industry || "Imported Account"),
      owner: String(row.deal_owner || row.owner || row["Deal Owner"] || "Sales Rep"),
      stage: String(row.crm_stage || row.stage || row["Crm Stage"] || row["CRM Stage"] || "Qualification"),
      forecastCategory: this.toForecast(row.forecast_category),
      value: Number(row.deal_value || row.value || row.amount || row["Deal Value Inr"] || row["Deal Value"] || 0),
      probability: Number(row.probability || row["Probability Pct"] || row["Probability"] || 0),
      createdDate: this.toDate(row.created_date || row["Created Date"]),
      closeDate: this.toDate(row.estimated_close_date || row.close_date || row["Estimated Close Date"]),
      daysInPipeline: Number(row.days_in_pipeline || row["Days In Current Stage"] || row["Days In Pipeline"] || 0),
      riskScore,
      healthScore,
      healthCategory: healthScore >= 70 ? "healthy" : healthScore >= 40 ? "watch" : "risk",
      engagementScore: Math.min(100, (totalCalls + totalEmails + totalMeetings) * 5),
      lastActivityAt,
      daysSinceLastContact,
      nextStep: String(row.next_step || row["Next Step"] || "").trim() || null,
      dealSummary: String(row.deal_summary || row["Deal Summary"] || ""),
      budgetConfirmed: this.toBool(row.budget_confirmed ?? row.budget ?? row["Budget Confirmed"] ?? row["Budget"]),
      decisionMakerEngaged: this.toBool(row.decision_maker_engaged ?? row.decision_maker ?? row["Decision Maker Engaged"] ?? row["Decision Maker"]),
      competitorName,
      totalCalls,
      totalEmails,
      lastCallSentiment: String(row.last_call_sentiment || row["Last Call Sentiment"] || ""),
      contactCount: Number(row.no_of_contacts || row.contact_count || row["No Of Contacts"] || 0),
      activityCount: Number(row.activity_count || 0) || totalCalls + totalEmails + totalMeetings
    };
  }

  private async ensurePlaybook(dealId: string) {
    const existing = await this.db.one<{ count: string }>("select count(*) from playbook_items where deal_id = $1", [dealId]);
    if (Number(existing?.count ?? 0)) return;
    for (const section of PLAYBOOK_SECTIONS) {
      await this.db.query(
        "insert into playbook_items (deal_id, category, status, ai_suggestion, notes) values ($1,$2,'missing',$3,'')",
        [dealId, section, `Confirm ${section.toLowerCase()} evidence and document it before the next customer touch.`]
      );
    }
  }

  private toForecast(value: unknown) {
    const normalized = String(value || "PIPELINE").toUpperCase().replace(/\s+/g, "_");
    return normalized === "COMMIT" ? "COMMIT" : normalized === "BEST_CASE" ? "BEST_CASE" : "PIPELINE";
  }

  private toBool(value: unknown) {
    return ["true", "yes", "1", "y", "confirmed"].includes(String(value).trim().toLowerCase());
  }

  private toDate(value: unknown) {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(String(value));
    return Number.isNaN(date.getTime()) ? null : date;
  }
}
