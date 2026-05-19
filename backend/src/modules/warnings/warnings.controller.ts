import { Controller, Get, NotFoundException, Param, Patch } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";

@Controller("deals/:id/warnings")
export class WarningsController {
  constructor(private readonly db: DatabaseService) {}

  @Get()
  list(@Param("id") id: string) {
    return this.db.many("select * from warnings where deal_id = $1 and is_active = true order by severity desc, created_at desc", [id]);
  }

  @Patch(":warningId")
  async markDone(@Param("id") id: string, @Param("warningId") warningId: string) {
    const warning = await this.db.one(
      `update warnings
       set is_active = false, resolved_at = now()
       where deal_id = $1 and id = $2 and is_active = true
       returning *`,
      [id, warningId]
    );

    if (!warning) throw new NotFoundException("Active warning not found");

    await this.db.query(
      `update deals
       set risk_flag_count = greatest(coalesce(risk_flag_count, 1) - 1, 0),
           warning_state = case
             when exists (select 1 from warnings where deal_id = $1 and is_active = true and severity = 'critical') then 'critical'::warning_state_enum
             when exists (select 1 from warnings where deal_id = $1 and is_active = true and severity in ('high', 'medium')) then 'warning'::warning_state_enum
             else 'none'::warning_state_enum
           end
       where id = $1`,
      [id]
    );

    return { status: "done", warning };
  }
}
