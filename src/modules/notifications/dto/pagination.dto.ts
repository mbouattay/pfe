import { IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class NotificationPaginationDto {
  @IsString()
  @IsOptional()
  cursor?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
