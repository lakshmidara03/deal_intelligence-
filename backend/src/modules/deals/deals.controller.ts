import { Body, Controller, Get, Param, Patch, Query } from "@nestjs/common";
import { HubspotSyncService } from "../crm-sync/hubspot-sync.service";
import { UpdateDealDto } from "./dto/update-deal.dto";
import { DealsService } from "./deals.service";

@Controller("deals")
export class DealsController {
  constructor(
    private readonly deals: DealsService,
    private readonly hubspot: HubspotSyncService
  ) {}

  @Get()
  list(@Query("forecastCategory") forecastCategory?: string, @Query("q") q?: string, @Query("stage") stage?: string, @Query("limit") limit?: string) {
    return this.deals.list({ forecastCategory, q, stage, limit: limit ? Number(limit) : undefined });
  }

  @Get("summary")
  summary() {
    return this.deals.summary();
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.deals.get(id);
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: UpdateDealDto) {
    const before = await this.deals.get(id);
    await this.deals.update(id, dto);
    return this.hubspot.syncDeal(id, { source: "save", before: { stage: before.stage, nextStep: before.nextStep, forecastCategory: before.forecastCategory, closeDate: before.closeDate } });
  }
}
