import { Module } from "@nestjs/common";
import { WarningsController } from "./warnings.controller";

@Module({ controllers: [WarningsController] })
export class WarningsModule {}
