import { Module } from "@nestjs/common";
import { CrmSyncController } from "./crm-sync.controller";
import { HubspotSyncService } from "./hubspot-sync.service";

@Module({ controllers: [CrmSyncController], providers: [HubspotSyncService], exports: [HubspotSyncService] })
export class CrmSyncModule {}
