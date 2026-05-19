import { Controller, Get, Param, Post } from "@nestjs/common";
import { HubspotSyncService } from "./hubspot-sync.service";

@Controller("crm")
export class CrmSyncController {
  constructor(private readonly hubspot: HubspotSyncService) {}

  @Get("status")
  status() {
    return this.hubspot.status();
  }

  @Post("sync/:id")
  sync(@Param("id") id: string) {
    return this.hubspot.syncDeal(id, { source: "manual" });
  }
}
