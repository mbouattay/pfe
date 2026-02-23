import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  MinLength,
} from 'class-validator';

export class CreateClientDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsString()
  @IsOptional()
  telephone?: string;

  @IsString()
  @IsNotEmpty()
  nomSociete: string;

  @IsString()
  @IsNotEmpty()
  localisation: string;
}

export class UpdateClientDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsString()
  @IsOptional()
  telephone?: string;

  @IsString()
  @IsOptional()
  nomSociete?: string;

  @IsString()
  @IsOptional()
  localisation?: string;
}