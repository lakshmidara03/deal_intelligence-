import { Module } from "@nestjs/common";
import { CrmSyncModule } from "../crm-sync/crm-sync.module";
import { DealsController } from "./deals.controller";
import { DealsService } from "./deals.service";

@Module({ imports: [CrmSyncModule], controllers: [DealsController], providers: [DealsService], exports: [DealsService] })
export class DealsModule {}
