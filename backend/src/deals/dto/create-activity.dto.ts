import { IsDateString, IsIn, IsString, MinLength } from 'class-validator';

export class CreateActivityDto {
  @IsIn(['EMAIL'])
  type!: 'EMAIL';

  @IsString()
  @MinLength(3)
  title!: string;

  @IsString()
  @MinLength(3)
  summary!: string;

  @IsString()
  @MinLength(5)
  rawText!: string;

  @IsDateString()
  occurredAt!: string;
}
