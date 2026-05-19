import { Controller, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { DatasetUploadService } from "./dataset-upload.service";

@Controller("dataset")
export class DatasetUploadController {
  constructor(private readonly uploads: DatasetUploadService) {}

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  upload(@UploadedFile() file: Express.Multer.File) {
    return this.uploads.ingest(file);
  }

  @Post("load-local")
  loadLocal() {
    return this.uploads.ingestFromConfiguredPath();
  }
}
