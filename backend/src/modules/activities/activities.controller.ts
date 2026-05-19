import { Controller, Get, Param } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";

@Controller("deals/:id/activity")
export class ActivitiesController {
  constructor(private readonly db: DatabaseService) {}

  @Get()
  list(@Param("id") id: string) {
    return this.db.many("select * from activities where deal_id = $1 order by occurred_at desc", [id]);
  }
}
