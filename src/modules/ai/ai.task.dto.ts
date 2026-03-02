import { IsString, IsOptional, IsInt, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class AiTextContextDto {
  @IsString()
  @IsOptional()
  description?: string;
}

export class AiQaDto {
  @IsString()
  question: string;
}

export class AiEstimateDto {
  @IsString()
  @IsOptional()
  description?: string;
}

export class AiShareDto {
  @IsString()
  type:
    | 'subtasks'
    | 'implementation'
    | 'estimate'
    | 'recommendations'
    | 'acceptance'
    | 'qa';
  @IsString()
  content: string;
}

export class AiAccuracyQueryDto {
  @IsString()
  @IsOptional()
  from?: string;
  @IsString()
  @IsOptional()
  to?: string;
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  bySprint?: boolean;
}

export class AiDetailedAnalyticsQueryDto {
  @IsString()
  @IsOptional()
  from?: string;
  @IsString()
  @IsOptional()
  to?: string;
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  sprintId?: number;
}
