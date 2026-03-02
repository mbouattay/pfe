import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 5000)
  content!: string;
}

export class UpdateCommentDto {
  @IsString()
  @IsOptional()
  @Length(1, 5000)
  content?: string;
}
