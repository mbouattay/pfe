import {
  IsString,
  IsOptional,
  IsEmail,
  MinLength,
} from 'class-validator';

export class CreateAdministrateurDto {
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
}

export class UpdateAdministrateurDto {
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
}
