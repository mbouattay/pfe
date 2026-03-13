import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class StartTimerDto {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  taskId?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  sprintTaskId?: number;
}

export class ManualEntryDto {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  taskId?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  sprintTaskId?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsBoolean()
  @IsOptional()
  billable?: boolean;

  @Type(() => Number)
  @Min(0)
  @IsOptional()
  billableRate?: number;
}

export class QueryEntriesDto {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  userId?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  taskId?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  marketingProjectId?: number;

  @IsDateString()
  @IsOptional()
  from?: string;

  @IsDateString()
  @IsOptional()
  to?: string;
}

export class UpdateEntryDto {
  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  startTime?: string;

  @IsDateString()
  @IsOptional()
  endTime?: string;

  @IsBoolean()
  @IsOptional()
  billable?: boolean;

  @Type(() => Number)
  @Min(0)
  @IsOptional()
  billableRate?: number;
}
