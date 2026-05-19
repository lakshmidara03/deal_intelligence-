import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import { DatabaseService } from "../database/database.service";
import { mapDeal } from "../deals/deal.mapper";

@Injectable()
export class AiService {
  private readonly aiUrl: string;

  constructor(
    private readonly db: DatabaseService,
    config: ConfigService
  ) {
    this.aiUrl = config.get<string>("AI_SERVICE_URL", "http://127.0.0.1:8001");
  }

  async predictDeal(id: string) {
    const deal = await this.db.one(
      `select d.*,
        (select count(*)::int from contacts c where c.deal_id = d.id) as contact_count,
        coalesce((select avg(case when p.status = 'complete' then 1 else 0 end) from playbook_items p where p.deal_id = d.id), 0) as playbook_completion
      from deals d where d.id = $1`,
      [id]
    );
    if (!deal) throw new NotFoundException("Deal not found");

    const payload = {
      id: deal.id,
      deal_name: deal.deal_name,
      stage: deal.stage,
      amount: Number(deal.value),
      estimated_close_date: deal.estimated_close_date,
      next_step: deal.next_step,
      contact_count: Number(deal.contact_count),
      activity_count: Number(deal.total_calls ?? 0) + Number(deal.total_emails ?? 0),
      decision_maker: deal.decision_maker_engaged ? "Yes" : "No",
      budget: deal.budget_confirmed ? "Confirmed" : "Pending",
      competitor: deal.competitor_name,
      total_calls: Number(deal.total_calls ?? 0),
      total_emails: Number(deal.total_emails ?? 0),
      days_in_pipeline: Number(deal.days_in_pipeline ?? 0),
      last_call_sentiment: deal.last_call_sentiment,
      playbook_completion: Number(deal.playbook_completion ?? 0),
      risk_score: Number(deal.risk_score ?? 0)
    };

    let data;
    try {
      const response = await axios.post(`${this.aiUrl}/predict`, payload, { timeout: 3000 });
      data = response.data;
    } catch {
      data = this.fallbackPrediction(deal);
    }
    await this.persistAiResult(id, data);
    const enriched = await this.db.one(
      `select d.*,
        coalesce((select jsonb_agg(to_jsonb(w)) from warnings w where w.deal_id = d.id and w.is_active), '[]'::jsonb) as warnings,
        coalesce((select jsonb_agg(to_jsonb(s)) from (select * from ai_scores ai where ai.deal_id = d.id order by ai.generated_at desc limit 1) s), '[]'::jsonb) as ai_scores
       from deals d where d.id = $1`,
      [id]
    );
    return enriched ? mapDeal(enriched) : null;
  }

  private fallbackPrediction(deal: Record<string, any>) {
    const budgetConfirmed = Boolean(deal.budget_confirmed);
    const decisionMakerEngaged = Boolean(deal.decision_maker_engaged);
    const competitorName = String(deal.competitor_name ?? "").trim();
    const daysSinceLastContact = Number(deal.days_since_last_contact ?? 0);
    const riskScore = Math.max(
      0,
      Math.min(
        100,
        Number(deal.risk_score ?? 50) +
          (budgetConfirmed ? -4 : 10) +
          (decisionMakerEngaged ? -4 : 10) +
          (competitorName ? 8 : 0) +
          (daysSinceLastContact >= 21 ? 10 : 0)
      )
    );
    const healthScore = Math.max(0, Math.min(100, 100 - riskScore));
    const warnings = [];

    if (!budgetConfirmed) {
      warnings.push({
        code: "budget_unconfirmed",
        severity: "high",
        title: "Budget Not Confirmed",
        explanation: "The deal does not show confirmed budget.",
        suggested_mitigation: "Confirm budget owner, approval path, and purchase timing.",
        cta_action: "Confirm budget"
      });
    }
    if (!decisionMakerEngaged) {
      warnings.push({
        code: "decision_maker_gap",
        severity: "high",
        title: "Decision Maker Gap",
        explanation: "Decision maker engagement is missing or unknown.",
        suggested_mitigation: "Map the economic buyer and request a direct validation meeting.",
        cta_action: "Map buyer"
      });
    }
    if (daysSinceLastContact >= 21) {
      warnings.push({
        code: "stale_activity",
        severity: daysSinceLastContact >= 45 ? "critical" : "medium",
        title: "Activity Is Stale",
        explanation: `${daysSinceLastContact} days since the last recorded activity.`,
        suggested_mitigation: "Schedule a customer touch and confirm the next milestone.",
        cta_action: "Schedule follow-up"
      });
    }
    if (competitorName) {
      warnings.push({
        code: "competitor_present",
        severity: "medium",
        title: "Competitor Present",
        explanation: `${competitorName} is listed as a competitor.`,
        suggested_mitigation: "Document differentiation and align it to decision criteria.",
        cta_action: "Update compete plan"
      });
    }

    const positiveSignals = [
      Number(deal.total_calls ?? 0) > 0 ? `${Number(deal.total_calls)} calls` : null,
      Number(deal.total_emails ?? 0) > 0 ? `${Number(deal.total_emails)} emails` : null,
      decisionMakerEngaged ? "decision maker engaged" : null
    ].filter(Boolean);
    const negativeSignals = [
      !budgetConfirmed ? "budget not confirmed" : null,
      !decisionMakerEngaged ? "decision maker gap" : null,
      competitorName ? "competitor present" : null,
      daysSinceLastContact >= 21 ? "stale activity" : null
    ].filter(Boolean);

    const explanation = [
      "Risk is driven by",
      !budgetConfirmed ? "budget not confirmed" : null,
      !decisionMakerEngaged ? "decision maker gap" : null,
      competitorName ? `${competitorName} is in the account` : null,
      daysSinceLastContact >= 21 ? "stale activity" : null
    ].filter(Boolean).join(", ");

    return {
      risk_score: Number(riskScore.toFixed(2)),
      health_score: Number(healthScore.toFixed(2)),
      health_category: healthScore >= 70 ? "healthy" : healthScore >= 40 ? "watch" : "risk",
      confidence_score: 72.0,
      warnings,
      positive_signals: positiveSignals,
      negative_signals: negativeSignals,
      explanation: explanation || "The deal has been recalculated from local board signals.",
      suggested_next_step: String(deal.next_step ?? "Confirm mutual action plan and next milestone with the buyer."),
      brief_summary: `${String(deal.deal_name ?? "Deal")} in ${String(deal.stage ?? "pipeline")} has been recalculated locally.`,
      buyer_sentiment: String(deal.last_call_sentiment ?? "Neutral"),
      what_changed: "Local fallback recalculated the deal because the AI service was unavailable.",
      model_version: "fallback-rf-regressor-v1"
    };
  }

  async persistAiResult(dealId: string, data: any) {
    await this.db.query("update warnings set is_active = false, resolved_at = now() where deal_id = $1", [dealId]);
    await this.db.one(
      `insert into ai_scores (
        deal_id, risk_score, health_score, confidence_score, positive_signals, negative_signals,
        explanation, suggested_next_step, brief_summary, buyer_sentiment, what_changed, model_version
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) returning *`,
      [
        dealId,
        data.risk_score,
        data.health_score,
        data.confidence_score ?? null,
        JSON.stringify(data.positive_signals ?? []),
        JSON.stringify(data.negative_signals ?? []),
        data.explanation,
        data.suggested_next_step,
        data.brief_summary,
        data.buyer_sentiment,
        data.what_changed,
        data.model_version ?? "rf-regressor-v1"
      ]
    );
    if (Array.isArray(data.warnings)) {
      for (const warning of data.warnings) {
        await this.db.query(
          `insert into warnings (deal_id, warning_type, severity, title, description, mitigation, cta_action)
           values ($1,$2,$3::warning_severity_enum,$4,$5,$6,$7)`,
          [dealId, warning.code, String(warning.severity).toLowerCase(), warning.title, warning.explanation, warning.suggested_mitigation, warning.cta_action]
        );
      }
    }
    const severity = data.warnings?.some((w: any) => String(w.severity).toLowerCase() === "critical")
      ? "critical"
      : data.warnings?.some((w: any) => String(w.severity).toLowerCase() === "high")
        ? "risk"
        : data.warnings?.length
          ? "warning"
          : "none";
    await this.db.query(
      `update deals set risk_score = $2, health_score = $3, health_category = $4::health_category_enum,
        warning_state = $5::warning_state_enum, risk_flag_count = $6, ai_explanation = $7,
        latest_insight_at = now(), board_updated_at = now()
       where id = $1`,
      [dealId, data.risk_score, data.health_score, data.health_category, severity, data.warnings?.length ?? 0, data.explanation]
    );
  }
}
