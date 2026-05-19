import { Body, Controller, Get, Param, Patch } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";

@Controller("deals/:id/playbook")
export class PlaybookController {
  constructor(private readonly db: DatabaseService) {}

  @Get()
  list(@Param("id") id: string) {
    return this.db.many("select * from playbook_items where deal_id = $1 order by category asc", [id]);
  }

  @Patch(":itemId")
  update(@Param("itemId") itemId: string, @Body() body: { completed?: boolean; notes?: string }) {
    const status = body.completed === undefined ? null : body.completed ? "complete" : "in_progress";
    return this.db.one(
      "update playbook_items set status = coalesce($2::playbook_status_enum, status), notes = coalesce($3, notes), updated_at = now() where id = $1 returning *",
      [itemId, status, body.notes ?? null]
    );
  }
}
