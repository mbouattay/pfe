import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateGradeDto {
  @IsString()
  @IsNotEmpty()
  nom: string;
}

export class UpdateGradeDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  nom: string;
}
