import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationPreferencesDto {
  @IsBoolean()
  @IsOptional()
  emailNewMessage?: boolean;

  @IsBoolean()
  @IsOptional()
  emailTaskAssigned?: boolean;

  @IsBoolean()
  @IsOptional()
  emailDeadlineReminder?: boolean;

  @IsBoolean()
  @IsOptional()
  inAppNewMessage?: boolean;

  @IsBoolean()
  @IsOptional()
  inAppTaskAssigned?: boolean;

  @IsBoolean()
  @IsOptional()
  inAppDeadlineReminder?: boolean;

  @IsBoolean()
  @IsOptional()
  pushEnabled?: boolean;
}
