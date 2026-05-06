import { IsBoolean, IsOptional } from 'class-validator';

export class AnalyzeDealDto {
  @IsBoolean()
  @IsOptional()
  refresh?: boolean;
}
