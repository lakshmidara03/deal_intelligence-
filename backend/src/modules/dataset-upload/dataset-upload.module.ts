import { Module } from "@nestjs/common";
import { AiModule } from "../ai/ai.module";
import { DatasetUploadController } from "./dataset-upload.controller";
import { DatasetUploadService } from "./dataset-upload.service";

@Module({ imports: [AiModule], controllers: [DatasetUploadController], providers: [DatasetUploadService] })
export class DatasetUploadModule {}
