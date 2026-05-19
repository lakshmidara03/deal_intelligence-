import { Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { UpdateDealDto } from "./dto/update-deal.dto";
import { mapDeal } from "./deal.mapper";

@Injectable()
export class DealsService {
  constructor(private readonly db: DatabaseService) {}

  async summary() {
    const rows = await this.db.many<{ forecast_category: string; count: number }>(
      `
      select forecast_category, count(*)::int as count
      from deals
      where forecast_category in ('PIPELINE', 'BEST_CASE', 'COMMIT')
      group by forecast_category
      `
    );
    const counts = {
      PIPELINE: 0,
      BEST_CASE: 0,
      COMMIT: 0
    };
    for (const row of rows) {
      if (row.forecast_category in counts) counts[row.forecast_category as keyof typeof counts] = Number(row.count);
    }
    return counts;
  }

  async list(filters: { forecastCategory?: string; q?: string; stage?: string; limit?: number }) {
    const rows = await this.db.many(
      `
      select d.*,
        (select count(*)::int from contacts c where c.deal_id = d.id) as contact_count,
        (select count(*)::int from activities a where a.deal_id = d.id) as activity_count,
        coalesce((select jsonb_agg(to_jsonb(w) order by w.created_at desc) from warnings w where w.deal_id = d.id and w.is_active), '[]'::jsonb) as warnings,
        coalesce((select jsonb_agg(to_jsonb(s) order by s.generated_at desc) from (select * from ai_scores ai where ai.deal_id = d.id order by ai.generated_at desc limit 1) s), '[]'::jsonb) as ai_scores,
        coalesce((select jsonb_agg(to_jsonb(a) order by a.occurred_at desc) from (select * from activities act where act.deal_id = d.id order by act.occurred_at desc limit 3) a), '[]'::jsonb) as activities,
        coalesce((select avg(case when p.status = 'complete' then 1 else 0 end) from playbook_items p where p.deal_id = d.id), 0) as playbook_completion
      from deals d
      where ($1::text is null or d.forecast_category = $1)
        and ($2::text is null or d.deal_name ilike '%' || $2 || '%' or d.account_name ilike '%' || $2 || '%')
        and ($3::text is null or d.stage = $3)
      order by d.risk_score desc nulls last, d.board_updated_at desc nulls last
      limit $4
      `,
      [filters.forecastCategory || null, filters.q || null, filters.stage || null, Math.max(1, Math.min(filters.limit || 1000, 1000))]
    );
    return rows.map(mapDeal);
  }

  async get(id: string) {
    const deal = await this.db.one(
      `
      select d.*,
        coalesce((select jsonb_agg(to_jsonb(c) order by c.created_at) from contacts c where c.deal_id = d.id), '[]'::jsonb) as contacts,
        coalesce((select jsonb_agg(to_jsonb(a) order by a.occurred_at desc) from activities a where a.deal_id = d.id), '[]'::jsonb) as activities,
        coalesce((select jsonb_agg(to_jsonb(w) order by w.created_at desc) from warnings w where w.deal_id = d.id and w.is_active), '[]'::jsonb) as warnings,
        coalesce((select jsonb_agg(to_jsonb(ai) order by ai.generated_at desc) from (select * from ai_scores s where s.deal_id = d.id order by s.generated_at desc limit 1) ai), '[]'::jsonb) as ai_scores,
        coalesce((select jsonb_agg(to_jsonb(p) order by p.category) from playbook_items p where p.deal_id = d.id), '[]'::jsonb) as playbook_items,
        coalesce((select jsonb_agg(to_jsonb(l) order by l.created_at desc) from (select * from crm_sync_logs csl where csl.deal_id = d.id order by csl.created_at desc limit 5) l), '[]'::jsonb) as crm_sync_logs
      from deals d
      where d.id = $1
      `,
      [id]
    );
    if (!deal) throw new NotFoundException("Deal not found");
    return mapDeal(deal);
  }

  update(id: string, dto: UpdateDealDto) {
    return this.db.one(
      `update deals set
        stage = coalesce($2, stage),
        next_step = coalesce($3, next_step),
        forecast_category = coalesce($4, forecast_category),
        estimated_close_date = coalesce($5::timestamp, estimated_close_date),
        board_updated_at = now()
       where id = $1
       returning *`,
      [id, dto.stage ?? null, dto.nextStep ?? null, dto.forecastCategory ?? null, dto.closeDate ?? null]
    );
  }
}
