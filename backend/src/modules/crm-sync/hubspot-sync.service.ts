import { Injectable, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosError, AxiosInstance } from "axios";
import { DatabaseService } from "../database/database.service";
import { mapDeal } from "../deals/deal.mapper";

type SyncSource = "manual" | "save";

type DealSnapshot = {
  stage?: string | null;
  nextStep?: string | null;
  forecastCategory?: string | null;
  closeDate?: string | null;
  name?: string | null;
  accountName?: string | null;
  amount?: number | null;
};

type HubSpotPipeline = {
  id?: string;
  label?: string;
  displayOrder?: number;
  stages?: Array<{
    id?: string;
    label?: string;
    displayOrder?: number;
  }>;
};

type SyncOptions = {
  source?: SyncSource;
  before?: DealSnapshot | null;
  changeSummary?: string;
};

@Injectable()
export class HubspotSyncService {
  private readonly client: AxiosInstance;
  private readonly token: string | undefined;
  private pipelineCache: HubSpotPipeline[] | null = null;

  constructor(
    private readonly db: DatabaseService,
    config: ConfigService
  ) {
    this.token = this.normalizeAccessToken(config.get<string>("HUBSPOT_ACCESS_TOKEN"));
    this.client = axios.create({
      baseURL: config.get<string>("HUBSPOT_BASE_URL", "https://api.hubapi.com"),
      timeout: 10000,
      headers: this.token ? { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" }
    });
  }

  async status() {
    if (!this.token) {
      return {
        configured: false,
        connected: false,
        message: "HUBSPOT_ACCESS_TOKEN is not configured"
      };
    }

    try {
      const pipelines = await this.loadPipelines(true);
      return {
        configured: true,
        connected: true,
        tokenPreview: this.previewToken(),
        pipelineCount: pipelines.length,
        pipelines: pipelines.map((pipeline) => ({
          id: pipeline.id,
          label: pipeline.label,
          stageCount: pipeline.stages?.length ?? 0
        }))
      };
    } catch (error) {
      return {
        configured: true,
        connected: false,
        tokenPreview: this.previewToken(),
        message: this.describeHubSpotError(error)
      };
    }
  }

  async syncDeal(dealId: string, options: SyncOptions = {}) {
    if (!this.token) {
      throw new ServiceUnavailableException("HUBSPOT_ACCESS_TOKEN is not configured");
    }

    const source = options.source ?? "manual";
    const deal = await this.loadDeal(dealId);
    const payload = this.buildSyncPayload(deal, source, options.before, options.changeSummary);

    await this.insertSyncLog(dealId, "syncing", payload, source === "save" ? "HubSpot save started" : "HubSpot sync started");

    try {
      const hubspotDealId = await this.withHubSpotStep("create deal", () => this.ensureHubSpotDeal(deal));
      const { pipelineId, stageId } = await this.resolveHubSpotPipelineAndStage(deal.stage);
      await this.withHubSpotStep("update deal", () => this.updateHubSpotDeal(hubspotDealId, deal, pipelineId, stageId));

      const noteResult = await this.tryCreateHubSpotNote(hubspotDealId, deal, options.before, options.changeSummary);
      const localHubspotDealId = String(hubspotDealId);
      if (String(deal.hubspot_deal_id ?? "") !== localHubspotDealId) {
        await this.db.query("update deals set hubspot_deal_id = $2 where id = $1", [dealId, localHubspotDealId]);
      }

      const syncedPayload = {
        ...payload,
        hubspotDealId: localHubspotDealId,
        noteId: noteResult.noteId,
        noteWarning: noteResult.warning,
        pipelineId,
        stageId
      };
      const logMessage = noteResult.warning ? `HubSpot deal updated. ${noteResult.warning}` : "HubSpot deal updated and history note created";
      const log = await this.insertSyncLog(dealId, "synced", syncedPayload, logMessage, true);
      const reloaded = await this.loadDeal(dealId);
      return {
        status: "synced",
        hubspotDealId: localHubspotDealId,
        noteId: noteResult.noteId,
        noteWarning: noteResult.warning,
        log,
        deal: mapDeal(await this.loadDealWithRelations(reloaded.id))
      };
    } catch (error) {
      const message = this.describeHubSpotError(error);
      await this.insertSyncLog(dealId, "failed", { ...payload, error: message }, message);
      throw new ServiceUnavailableException(`HubSpot sync failed: ${message}`);
    }
  }

  private async loadDeal(dealId: string) {
    const deal = await this.db.one(
      `select d.*
       from deals d
       where d.id = $1`,
      [dealId]
    );
    if (!deal) throw new NotFoundException("Deal not found");
    return deal;
  }

  private async loadDealWithRelations(dealId: string) {
    const deal = await this.db.one(
      `select d.*,
        coalesce((select jsonb_agg(to_jsonb(c) order by c.created_at) from contacts c where c.deal_id = d.id), '[]'::jsonb) as contacts,
        coalesce((select jsonb_agg(to_jsonb(a) order by a.occurred_at desc) from activities a where a.deal_id = d.id), '[]'::jsonb) as activities,
        coalesce((select jsonb_agg(to_jsonb(w) order by w.created_at desc) from warnings w where w.deal_id = d.id and w.is_active), '[]'::jsonb) as warnings,
        coalesce((select jsonb_agg(to_jsonb(ai) order by ai.generated_at desc) from (select * from ai_scores s where s.deal_id = d.id order by s.generated_at desc limit 1) ai), '[]'::jsonb) as ai_scores,
        coalesce((select jsonb_agg(to_jsonb(p) order by p.category) from playbook_items p where p.deal_id = d.id), '[]'::jsonb) as playbook_items,
        coalesce((select jsonb_agg(to_jsonb(l) order by l.created_at desc) from (select * from crm_sync_logs csl where csl.deal_id = d.id order by csl.created_at desc limit 5) l), '[]'::jsonb) as crm_sync_logs
       from deals d
       where d.id = $1`,
      [dealId]
    );
    if (!deal) throw new NotFoundException("Deal not found");
    return deal;
  }

  private async insertSyncLog(
    dealId: string,
    syncStatus: "syncing" | "synced" | "failed",
    payload: Record<string, unknown>,
    message: string,
    syncedAt = false
  ) {
    return this.db.one(
      `insert into crm_sync_logs (deal_id, sync_status, payload, message, synced_at)
       values ($1, $2::crm_sync_status_enum, $3, $4, ${syncedAt ? "now()" : "null"}) returning *`,
      [dealId, syncStatus, payload, message]
    );
  }

  private buildSyncPayload(deal: Record<string, any>, source: SyncSource, before?: DealSnapshot | null, changeSummary?: string) {
    return {
      source,
      localDealId: deal.id,
      localCrmDealId: deal.crm_deal_id,
      hubspotDealId: deal.hubspot_deal_id ?? null,
      before: before ?? null,
      current: {
        stage: deal.stage,
        nextStep: deal.next_step,
        forecastCategory: deal.forecast_category,
        closeDate: deal.estimated_close_date,
        name: deal.deal_name,
        accountName: deal.account_name,
        amount: deal.value
      },
      changeSummary: changeSummary ?? null
    };
  }

  private async ensureHubSpotDeal(deal: Record<string, any>) {
    if (deal.hubspot_deal_id) return String(deal.hubspot_deal_id);

    const { pipelineId, stageId } = await this.resolveHubSpotPipelineAndStage(deal.stage);
    const response = await this.client.post("/crm/v3/objects/deals", {
      properties: this.buildDealProperties(deal, pipelineId, stageId)
    });
    const createdId = String(response.data?.id);
    return createdId;
  }

  private async updateHubSpotDeal(hubspotDealId: string, deal: Record<string, any>, pipelineId: string, stageId: string) {
    await this.client.patch(`/crm/v3/objects/deals/${hubspotDealId}`, {
      properties: this.buildDealProperties(deal, pipelineId, stageId)
    });
  }

  private buildDealProperties(deal: Record<string, any>, pipelineId: string, stageId: string) {
    const closedate = this.formatDate(deal.estimated_close_date);
    return this.compactProperties({
      dealname: String(deal.deal_name ?? deal.dealName ?? "Untitled deal"),
      dealstage: stageId,
      pipeline: pipelineId,
      amount: deal.value != null ? Number(deal.value).toFixed(2) : undefined,
      closedate: closedate ?? undefined
    });
  }

  private async createHubSpotNote(hubspotDealId: string, deal: Record<string, any>, before?: DealSnapshot | null, changeSummary?: string) {
    const body = this.buildNoteBody(deal, before, changeSummary);
    const response = await this.client.post("/crm/v3/objects/notes", {
      properties: {
        hs_timestamp: new Date().toISOString(),
        hs_note_body: body
      },
      associations: [
        {
          to: { id: Number.isNaN(Number(hubspotDealId)) ? hubspotDealId : Number(hubspotDealId) },
          types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 214 }]
        }
      ]
    });
    return response.data?.id ?? null;
  }

  private async tryCreateHubSpotNote(hubspotDealId: string, deal: Record<string, any>, before?: DealSnapshot | null, changeSummary?: string) {
    try {
      return {
        noteId: await this.withHubSpotStep("create note", () => this.createHubSpotNote(hubspotDealId, deal, before, changeSummary)),
        warning: null
      };
    } catch (error) {
      if (this.isHubSpotForbidden(error)) {
        return {
          noteId: null,
          warning: "History note was skipped because the HubSpot private app is missing note/association write permissions."
        };
      }
      throw error;
    }
  }

  private buildNoteBody(deal: Record<string, any>, before?: DealSnapshot | null, changeSummary?: string) {
    const lines = [
      `Deal Boards sync for ${String(deal.deal_name ?? "deal")}`,
      changeSummary ?? this.diffSummary(before, deal),
      `Stage: ${String(deal.stage ?? "unknown")}`,
      `Forecast: ${String(deal.forecast_category ?? "PIPELINE")}`,
      `Close date: ${this.formatDate(deal.estimated_close_date) ?? "not set"}`,
      `Next step: ${String(deal.next_step ?? "not set")}`,
      `Source: Deal Boards app`
    ].filter(Boolean);
    return lines.join("\n");
  }

  private diffSummary(before: DealSnapshot | null | undefined, after: Record<string, any>) {
    if (!before) return "Initial HubSpot sync created from Deal Boards.";

    const changes: string[] = [];
    if ((before.stage ?? "") !== String(after.stage ?? "")) changes.push(`Stage ${before.stage ?? "unset"} -> ${after.stage ?? "unset"}`);
    if ((before.nextStep ?? "") !== String(after.next_step ?? "")) changes.push("Next step updated");
    if ((before.forecastCategory ?? "") !== String(after.forecast_category ?? "")) changes.push("Forecast category changed");
    if ((before.closeDate ?? "") !== String(this.formatDate(after.estimated_close_date) ?? "")) changes.push("Close date updated");
    if (!changes.length) return "Deal was synced with no visible field changes.";
    return `Updated: ${changes.join("; ")}`;
  }

  private formatDate(value: unknown) {
    if (!value) return null;
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 10);
  }

  private compactProperties(properties: Record<string, unknown>) {
    return Object.fromEntries(Object.entries(properties).filter(([, value]) => value !== undefined && value !== null && value !== ""));
  }

  private async resolveHubSpotPipelineAndStage(stageLabel: string) {
    const pipelines = await this.loadPipelines();
    if (!pipelines.length) {
      throw new ServiceUnavailableException("No HubSpot deal pipelines are available");
    }

    const targetPipeline =
      pipelines.find((pipeline) => String(pipeline.id ?? "").toLowerCase() === "default") ||
      pipelines.find((pipeline) => Boolean(pipeline.stages?.length)) ||
      pipelines[0];

    const stages = targetPipeline.stages ?? [];
    const normalized = this.normalize(stageLabel);
    const aliases = this.stageAliases(normalized);
    const matchedStage =
      stages.find((stage) => aliases.includes(this.normalize(stage.label ?? ""))) ||
      stages.find((stage) => aliases.includes(this.normalize(stage.id ?? ""))) ||
      stages[0];

    if (!matchedStage?.id) {
      throw new ServiceUnavailableException("No HubSpot deal stages are available");
    }

    return {
      pipelineId: String(targetPipeline.id ?? "default"),
      stageId: String(matchedStage.id)
    };
  }

  private stageAliases(normalized: string) {
    const aliases: Record<string, string[]> = {
      prospecting: ["prospecting", "appointmentscheduled", "appointmentscheduled", "newbusiness"],
      qualification: ["qualification", "qualifiedtobuy", "qualified", "discoverycall"],
      discovery: ["discovery", "demo", "demoscheduled", "needsanalysis"],
      proposal: ["proposal", "presentation", "pricequote", "quote", "solution"],
      negotiation: ["negotiation", "contractsent", "finalreview", "decisionmakerboughtin"],
      "closedwon": ["closedwon", "won"],
      "closedlost": ["closedlost", "lost"]
    };
    return aliases[normalized] ?? [normalized];
  }

  private normalize(value: string) {
    return String(value ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");
  }

  private normalizeAccessToken(value: string | undefined) {
    const token = value?.trim().replace(/^["']|["']$/g, "");
    if (!token) return undefined;
    return token.replace(/^Bearer\s+/i, "").trim();
  }

  private previewToken() {
    if (!this.token) return null;
    if (this.token.length <= 8) return `${this.token.slice(0, 2)}...`;
    return `${this.token.slice(0, 4)}...${this.token.slice(-4)}`;
  }

  private async loadPipelines(forceRefresh = false): Promise<HubSpotPipeline[]> {
    if (this.pipelineCache && !forceRefresh) return this.pipelineCache;
    const response = await this.client.get("/crm/v3/pipelines/deals");
    const pipelines = Array.isArray(response.data?.results) ? (response.data.results as HubSpotPipeline[]) : [];
    this.pipelineCache = pipelines;
    return pipelines;
  }

  private describeHubSpotError(error: unknown) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>;
      const status = axiosError.response?.status;
      const data = axiosError.response?.data;
      const hubspotMessage = data?.message || data?.error || data?.category;
      const detail = hubspotMessage ? String(hubspotMessage) : axiosError.message;
      return status ? `HubSpot API ${status}: ${detail}` : detail;
    }
    return error instanceof Error ? error.message : "HubSpot sync failed";
  }

  private async withHubSpotStep<T>(step: string, action: () => Promise<T>) {
    try {
      return await action();
    } catch (error) {
      const message = this.describeHubSpotError(error);
      throw new Error(`${step}: ${message}`);
    }
  }

  private isHubSpotForbidden(error: unknown) {
    if (!(error instanceof Error)) return false;
    return error.message.includes("HubSpot API 403");
  }
}
