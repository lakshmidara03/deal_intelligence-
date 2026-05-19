import { Controller, Param, Post } from "@nestjs/common";
import { AiService } from "./ai.service";

@Controller("ai")
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post("predict/:id")
  predict(@Param("id") id: string) {
    return this.ai.predictDeal(id);
  }
}
