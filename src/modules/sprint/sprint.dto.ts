import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsDateString,
  IsOptional,
  IsEnum,
  Min,
} from 'class-validator';
import { SprintStatus } from '@prisma/client';

export class CreateSprintDto {
  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsEnum(SprintStatus)
  @IsOptional()
  status?: SprintStatus;

  @IsString()
  @IsOptional()
  goal?: string;

  @IsDateString()
  dateDebut: string;

  @IsDateString()
  dateFin: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  totalStoryPoints?: number;

  @IsInt()
  webProjectId: number;
}

export class UpdateSprintDto {
  @IsString()
  @IsOptional()
  nom?: string;

  @IsEnum(SprintStatus)
  @IsOptional()
  status?: SprintStatus;

  @IsString()
  @IsOptional()
  goal?: string;

  @IsDateString()
  @IsOptional()
  dateDebut?: string;

  @IsDateString()
  @IsOptional()
  dateFin?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  totalStoryPoints?: number;

  @IsInt()
  @IsOptional()
  webProjectId?: number;
}
