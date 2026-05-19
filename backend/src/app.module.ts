import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ActivitiesModule } from "./modules/activities/activities.module";
import { AiModule } from "./modules/ai/ai.module";
import { AuthModule } from "./modules/auth/auth.module";
import { BoardsModule } from "./modules/boards/boards.module";
import { CrmSyncModule } from "./modules/crm-sync/crm-sync.module";
import { DatasetUploadModule } from "./modules/dataset-upload/dataset-upload.module";
import { DealsModule } from "./modules/deals/deals.module";
import { PlaybookModule } from "./modules/playbook/playbook.module";
import { DatabaseModule } from "./modules/database/database.module";
import { UsersModule } from "./modules/users/users.module";
import { WarningsModule } from "./modules/warnings/warnings.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    BoardsModule,
    DealsModule,
    ActivitiesModule,
    WarningsModule,
    PlaybookModule,
    AiModule,
    CrmSyncModule,
    DatasetUploadModule
  ]
})
export class AppModule {}
