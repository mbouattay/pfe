import { IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @Length(1, 5000)
  content: string;

  @IsOptional()
  @IsUUID()
  replyToId?: string;
}
