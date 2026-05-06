import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AnalyzeDealDto } from './dto/analyze-deal.dto';
import { DealsService } from './deals.service';

@ApiTags('deals')
@Controller('deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Get()
  findAll(@Query('accountId') accountId?: string) {
    return this.dealsService.findAll(accountId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dealsService.findOne(id);
  }

  @Get(':id/activities')
  findActivities(@Param('id') id: string) {
    return this.dealsService.findActivities(id);
  }

  @Get(':id/insights')
  findInsights(@Param('id') id: string) {
    return this.dealsService.findInsights(id);
  }

  @Post(':id/analyze')
  analyze(@Param('id') id: string, @Body() dto: AnalyzeDealDto) {
    return this.dealsService.analyze(id, dto);
  }
}
