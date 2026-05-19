import { IsDateString, IsEnum, IsOptional, IsString } from "class-validator";

export enum ForecastCategoryDto {
  PIPELINE = "PIPELINE",
  BEST_CASE = "BEST_CASE",
  COMMIT = "COMMIT"
}

export class UpdateDealDto {
  @IsOptional()
  @IsString()
  stage?: string;

  @IsOptional()
  @IsString()
  nextStep?: string;

  @IsOptional()
  @IsEnum(ForecastCategoryDto)
  forecastCategory?: ForecastCategoryDto;

  @IsOptional()
  @IsDateString()
  closeDate?: string;
}
