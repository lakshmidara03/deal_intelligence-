import { Module } from "@nestjs/common";
import { PlaybookController } from "./playbook.controller";

@Module({ controllers: [PlaybookController] })
export class PlaybookModule {}
