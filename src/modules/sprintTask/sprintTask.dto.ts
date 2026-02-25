import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsDateString,
  IsOptional,
  IsEnum,
  Min,
} from 'class-validator';
import { TaskStatus } from '@prisma/client';

export class CreateSprintTaskDto {
  @IsString()
  @IsNotEmpty()
  titre: string;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsInt()
  @Min(1)
  priority: number;

  @IsDateString()
  dateDebut: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  storyPoints?: number;

  @IsInt()
  sprintId: number;
}

export class UpdateSprintTaskDto {
  @IsString()
  @IsOptional()
  titre?: string;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsInt()
  @Min(1)
  @IsOptional()
  priority?: number;

  @IsDateString()
  @IsOptional()
  dateDebut?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  storyPoints?: number;

  @IsInt()
  @IsOptional()
  sprintId?: number;
}
